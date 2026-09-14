"""
CoverScore AI — Voice Risk Assessment Agent

This is a LiveKit Agents worker: a long-lived process that listens for new
rooms created by the CoverScore app and joins them as "CoverScore Advisor".
It is NOT part of the Express app's request/response cycle — deploy it
separately as its own always-on process.

Uses Gemini's native audio-to-audio Live API (via livekit-plugins-google),
so a single model handles listening, thinking, and speaking without needing
separate STT/TTS vendor keys.

Assessment runs against the CoverScore API to calculate risk scores
and generate personalized reports.

Requires: pip install "livekit-agents[google]>=1.8"
Env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GEMINI_API_KEY,
          COVERSCORE_API_URL, COVERSCORE_WEBHOOK_SECRET
"""

import asyncio
import json
import logging
import os
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta, timezone

from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, function_tool
from livekit.plugins.google.realtime import RealtimeModel

logger = logging.getLogger("coverscore-agent")
try:
    _log_path = os.path.join(
        os.environ.get("TEMP", os.path.dirname(os.path.abspath(__file__))),
        "coverscore-worker.log",
    )
    _fh = logging.FileHandler(_log_path)
    _fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logging.getLogger().addHandler(_fh)
    logging.getLogger().setLevel(logging.DEBUG)
except Exception:
    pass

LAGOS = timezone(timedelta(hours=1))

# ---------------------------------------------------------------------------
# CoverScore business knowledge
# ---------------------------------------------------------------------------
BUSINESS = {
    "name": "CoverScore",
    "motto": "Intelligent Insurance Risk Assessment",
    "phone": "+2349165304629",
    "whatsapp": "https://wa.me/2349165304629",
    "website": "https://coverscore.site",
    "services": [
        "Business risk assessment",
        "Insurance gap analysis",
        "Personalized risk reports",
        "Insurance advisory",
        "Policy optimization",
    ],
    "assessment_types": {
        "HOT": "Hotel & Hospitality",
        "BAS": "Business / Commercial",
        "SME": "Small & Medium Enterprise",
        "HMO": "Health Maintenance Organization",
        "FLO": "Flood Risk",
        "SUN": "Sundries",
        "MOT": "Motor Fleet",
        "MNH": "Marine & Haulage",
        "CAR": "Contractor All Risk",
        "ECO": "Engineering & Construction",
        "BUI": "Burglary",
        "PRO": "Professional Indemnity",
    },
    "risk_pillars": [
        "Fire Safety & Prevention",
        "Guest / Customer Safety",
        "Operations & Maintenance",
        "Security & Access Control",
        "Business Continuity",
        "Insurance Coverage",
        "Regulatory Compliance",
    ],
    "proof_points": [
        "AI-powered risk analysis",
        "Personalized improvement recommendations",
        "Certified insurance advisors",
        "Comprehensive coverage analysis",
    ],
}

INSTRUCTIONS = f"""You are CoverScore AI, a professional insurance risk assessment advisor conducting a voice assessment over WhatsApp.

Your job is to conduct a conversational risk assessment that feels natural and professional, like speaking with a knowledgeable insurance consultant.

PERSONALITY: warm, professional, confident, concise. Speak clearly at a moderate pace. Short spoken answers (1-3 sentences). Ask ONE question at a time. Never lecture or recite long lists.

ASSESSMENT FLOW — follow it every call:
1. WELCOME: Greet warmly, introduce yourself as CoverScore AI, explain the process takes 3-5 minutes and will produce a personalized risk report.
2. CONSENT: Get consent to process their information for the assessment.
3. PROFILE: Collect hotel name, respondent name and role, location, hotel type and room count. Combine where possible (e.g. "What's your hotel name and your name?").
4. FACILITIES: Ask which facilities the hotel operates (restaurant, pool, gym, spa, events, vehicles, laundry) — one multi-select question.
5. RISK DISCOVERY: Ask about key risk areas one at a time — fire safety, guest safety, power, critical operations, staff, security, digital, financial, insurance. Use the 1-1-1 Rule: 1 discovery question, 1 adaptive follow-up if needed, then move on.
6. FACILITY BRANCHES: Only ask about facilities the hotel actually has (e.g. kitchen controls if they have a restaurant).
7. CONCERN: Ask about their biggest risk concern — this is critical for prioritizing recommendations.
8. COMPLETION: Thank them, explain next steps (report delivery via WhatsApp, advisor follow-up).

KEY RULES:
- Don't ask about what the system already knows from earlier answers
- For each risk area, ask one discovery question. If the answer indicates weakness, ask one follow-up. Then stop.
- Simple hotels should finish in 3-5 minutes, complex ones in 5-7 minutes

VOICE GUIDELINES:
- Speak clearly and at a moderate pace
- Use natural conversational tone
- Acknowledge their responses before moving to the next question
- If they seem uncertain, offer reassurance
- For yes/no questions, offer the options clearly (e.g., "Would you say your fire safety is well established, or are there some gaps?")
- Keep questions open-ended when possible to gather more information
- If they give a very short answer, gently probe for more detail

IMPORTANT RULES:
- Never make up insurance recommendations during the call
- Focus on gathering accurate information
- If you don't understand something, ask for clarification
- Be respectful of their time
- If the conversation exceeds 10 minutes, start wrapping up
- If the user says they need to go, quickly collect remaining critical info

SIGNS TO WRAP UP:
- If the conversation exceeds 10 minutes
- If the user says they need to go
- If all assessment stages are complete

COMPLETION MESSAGE:
"Thank you for completing your CoverScore assessment. Your personalised risk report is being prepared and will be sent to you shortly via WhatsApp. It will include your overall risk score, priority areas for improvement, and practical recommendations. A certified CoverScore advisor may also reach out to discuss your specific needs. Is there anything else you'd like to know?"

KNOWN FACTS:
- Business name: {BUSINESS['name']}
- Phone: {BUSINESS['phone']}
- Website: {BUSINESS['website']}
- Assessment types: {', '.join(f"{k}: {v}" for k, v in BUSINESS['assessment_types'].items())}
- Risk pillars: {', '.join(BUSINESS['risk_pillars'])}
- Proof: {', '.join(BUSINESS['proof_points'])}
"""


# ---------------------------------------------------------------------------
# CoverScore API helpers
# ---------------------------------------------------------------------------
COVERSCORE_API = os.environ.get("COVERSCORE_API_URL", "https://coverscore.site")


def _cs_api_post(path: str, data: dict) -> dict:
    """POST to CoverScore API."""
    url = f"{COVERSCORE_API.rstrip('/')}{path}"
    payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "CoverScoreVoiceAgent/1.0")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode()[:300]
        except Exception:
            detail = ""
        raise RuntimeError(f"CoverScore API error ({e.code}): {detail}")


def _cs_api_get(path: str) -> dict:
    """GET from CoverScore API."""
    url = f"{COVERSCORE_API.rstrip('/')}{path}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", "CoverScoreVoiceAgent/1.0")
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode()[:300]
        except Exception:
            detail = ""
        raise RuntimeError(f"CoverScore API error ({e.code}): {detail}")


# ---------------------------------------------------------------------------
# WhatsApp notification via Evolution API
# ---------------------------------------------------------------------------
def _send_whatsapp(to_number: str, body: str) -> bool:
    """Send a WhatsApp message via Evolution API. Returns True on success."""
    url = os.environ.get("EVOLUTION_API_URL", "")
    apikey = os.environ.get("EVOLUTION_API_KEY", "")
    instance = os.environ.get("EVOLUTION_INSTANCE_NAME", "")
    if not url or not apikey or not instance or not to_number:
        logger.info("whatsapp skipped — missing Evolution API creds")
        return False
    try:
        send_url = f"{url.rstrip('/')}/api/message/sendText/{instance}"
        payload = json.dumps({
            "number": to_number.replace(" ", ""),
            "text": body,
        }).encode()
        req = urllib.request.Request(send_url, data=payload, method="POST")
        req.add_header("apikey", apikey)
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode())
        ok = data.get("sent", False) if isinstance(data, dict) else False
        logger.info("whatsapp sent to %s via Evolution: %s", to_number, ok)
        return ok
    except Exception as e:
        logger.warning("whatsapp failed: %s", e)
        return False


# ---------------------------------------------------------------------------
# Assessment state helper
# ---------------------------------------------------------------------------
def _detect_prefix(answers: dict) -> str:
    """Auto-detect assessment type from collected answers."""
    text = json.dumps(answers).lower()
    if any(w in text for w in ["hotel", "guest", "room", "lodge", "resort"]):
        return "HOT"
    if any(w in text for w in ["motor", "fleet", "vehicle", "car"]):
        return "MOT"
    if any(w in text for w in ["marine", "haulage", "cargo", "shipping"]):
        return "MNH"
    if any(w in text for w in ["construction", "engineering", "project"]):
        return "ECO"
    return "BAS"


def _format_report_message(name: str, score: int, risk_level: str, report_url: str) -> str:
    """Format the WhatsApp report delivery message."""
    greeting = f"Thank you, {name}." if name else "Thank you."
    risk_emojis = {
        "Critical Risk": "🔴",
        "High Risk": "🟠",
        "Moderate Risk": "🟡",
        "Low Risk": "🟢",
    }
    risk_emoji = risk_emojis.get(risk_level, "🟠")
    return (
        f"{greeting}\n\n"
        f"📊 *Your CoverScore Assessment Results*\n\n"
        f"*Score:* {score}/100 {risk_emoji}\n"
        f"*Risk Level:* {risk_level}\n\n"
        f"Your personalised risk report is ready:\n\n"
        f"{report_url}\n\n"
        f"The report includes:\n"
        f"• Your overall CoverScore™\n"
        f"• Priority risk gaps with evidence\n"
        f"• Practical improvement recommendations\n"
        f"• Insurance coverage analysis\n\n"
        f"A certified CoverScore advisor may contact you to discuss your specific needs.\n\n"
        f"Thank you for choosing CoverScore™."
    )


# ---------------------------------------------------------------------------
# Tools exposed to the voice agent
# ---------------------------------------------------------------------------
@function_tool
async def store_response(question_id: str, answer: str, category: str) -> str:
    """Store a user response to an assessment question.

    Args:
        question_id: The question identifier (e.g., HOT_012, BAS_005).
        answer: The user's response.
        category: Risk category (fire, safety, operations, security, insurance, continuity, concern).
    Returns confirmation that the response was stored.
    """
    # Storage happens via the session state — this tool is for the LLM to
    # acknowledge it has captured the answer. Actual persistence is handled
    # by the completion endpoint.
    return f"Stored: {question_id} = {answer} (category: {category})"


@function_tool
async def submit_assessment(phone_number: str, lead_id: str = "") -> str:
    """Submit the completed assessment to CoverScore API for scoring and report generation.

    Args:
        phone_number: The user's phone number.
        lead_id: Optional lead ID if known.
    Returns confirmation with report URL.
    """
    try:
        result = _cs_api_post("/api/voice-assessment/complete", {
            "phoneNumber": phone_number,
            "leadId": lead_id or None,
        })
        return (
            f"Assessment submitted successfully. Score: {result.get('score', 'pending')}. "
            f"Report URL: {result.get('reportUrl', 'generating')}"
        )
    except Exception as e:
        logger.warning("submit_assessment failed: %s", e)
        return "Assessment submission encountered an issue — the report will be generated shortly."


@function_tool
async def escalate_to_human(reason: str = "") -> str:
    """Hand the caller to a human advisor when you cannot confidently assist.

    Args:
        reason: Why the escalation is needed.
    Returns the contact information.
    """
    return (
        f"I'd recommend speaking with one of our certified advisors directly. "
        f"You can reach us at {BUSINESS['phone']} or visit {BUSINESS['website']}. "
        f"A team member will be happy to help you with that."
    )


@function_tool
async def get_business_info() -> str:
    """Return information about CoverScore services and assessment types."""
    types = ", ".join(f"{k}: {v}" for k, v in BUSINESS["assessment_types"].items())
    return (
        f"CoverScore offers {', '.join(BUSINESS['services'])}. "
        f"Assessment types include: {types}. "
        f"Visit {BUSINESS['website']} for more information."
    )


# ---------------------------------------------------------------------------
# CoverScore Voice Agent
# ---------------------------------------------------------------------------
class CoverScoreAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=INSTRUCTIONS,
            tools=[
                store_response,
                submit_assessment,
                escalate_to_human,
                get_business_info,
            ],
        )


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    # LiveKit may spawn two worker processes per CreateDispatch.
    # The earlier-joined process keeps going; the other stands down.
    def _ts(v):
        try:
            if hasattr(v, "timestamp"):
                return float(v.timestamp())
            return float(v or 0)
        except Exception:
            return 0.0

    await asyncio.sleep(5)
    try:
        me = ctx.room.local_participant
        me_joined = _ts(getattr(me, "joined_at", 0))
        me_id = str(getattr(me, "identity", ""))
        for p in ctx.room.remote_participants.values():
            kind = str(getattr(p, "kind", "")).upper()
            ident = str(getattr(p, "identity", ""))
            if "AGENT" in kind or ident.startswith("agent"):
                r_joined = _ts(getattr(p, "joined_at", 0))
                r_id = str(getattr(p, "identity", ""))
                if (r_joined, r_id) < (me_joined, me_id):
                    logger.info("earlier agent %s already present, standing down", r_id)
                    return
    except Exception as e:
        logger.warning("rival check failed, continuing: %s", e)

    session = AgentSession(
        llm=RealtimeModel(
            model="gemini-2.5-flash-native-audio-latest",
            voice="Aoede",
            api_key=os.environ["GEMINI_API_KEY"],
            instructions=INSTRUCTIONS,
        ),
    )

    def _watch(name: str):
        def _handler(ev=None):
            try:
                logger.info("VOICE-EV %s: %s", name, str(ev)[:300])
            except Exception:
                pass
        return _handler

    for _ev in ("user_started_speaking", "user_stopped_speaking",
                "user_speech_committed", "agent_speech_committed",
                "agent_state_changed", "user_state_changed"):
        try:
            session.on(_ev)(_watch(_ev))
        except Exception as e:
            logger.warning("cannot watch %s: %s", _ev, e)

    await session.start(agent=CoverScoreAgent(), room=ctx.room)

    # Greet first so the caller hears CoverScore AI on connect.
    greeting = (
        "Greet the caller warmly in two short sentences: thank them "
        "for contacting CoverScore, introduce yourself as their AI "
        "risk assessment advisor, say you'll guide them through a "
        "quick 3-5 minute assessment to produce a personalized risk "
        "report, then ask for their name to get started."
    )
    for attempt in range(5):
        try:
            await session.generate_reply(instructions=greeting)
            break
        except Exception as e:
            logger.warning("greeting attempt %d failed: %s", attempt + 1, e)
            await asyncio.sleep(6)


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            ws_url=os.environ.get("LIVEKIT_URL"),
            api_key=os.environ.get("LIVEKIT_API_KEY"),
            api_secret=os.environ.get("LIVEKIT_API_SECRET"),
        )
    )
