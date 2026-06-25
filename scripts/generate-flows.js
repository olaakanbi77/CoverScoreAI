const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(8).toString('hex');

const nodes = [];

const pgConfig = {
    id: generateId(),
    type: "postgresdb",
    hostname: "postgres",
    port: "5432",
    db: "coverscore",
    ssl: false
};
nodes.push(pgConfig);

const createTab = (label) => { 
    const id = generateId(); 
    nodes.push({ id, type: "tab", label, disabled: false }); 
    return id; 
};

// Create the subflow Definition node AND its internal IN and OUT nodes
const createSubflow = (name) => { 
    const sfId = generateId(); 
    const inNodeId = generateId();
    const outNodeId = generateId();
    
    // Subflow Definition Node
    nodes.push({ 
        id: sfId, type: "subflow", name, info: "", 
        in: [{ x: 50, y: 50, wires: [], id: inNodeId }], 
        out: [{ x: 500, y: 50, wires: [], id: outNodeId }] 
    }); 
    
    // Internal Input Node
    nodes.push({ id: inNodeId, z: sfId, type: "subflow", name: "", direction: "in", x: 50, y: 50, wires: [[]] });
    
    // Internal Output Node
    nodes.push({ id: outNodeId, z: sfId, type: "subflow", name: "", direction: "out", x: 500, y: 50, wires: [] });
    
    return sfId; 
};

const TABS = {
    WEBHOOKS: createTab("TAB 01 — Webhook Gateway"),
    ROUTER: createTab("TAB 02 — Message Router"),
    ASSESSMENT: createTab("TAB 03 — Family Protection Assessment")
};

const SUBFLOWS = {
    NORMALIZE: createSubflow("SUBFLOW 01 — Normalize Evolution Event"),
    GUARD: createSubflow("SUBFLOW 02 — Duplicate Message Guard"),
    RESOLVE_LEAD: createSubflow("SUBFLOW 03 — Resolve Lead"),
    RESOLVE_SESSION: createSubflow("SUBFLOW 04 — Resolve Assessment Session"),
    SEND_MSG: createSubflow("SUBFLOW 05 — Send WhatsApp Message"),
    WRITE_MSG: createSubflow("SUBFLOW 06 — Write Conversation Message"),
    SAVE_ANS: createSubflow("SUBFLOW 07 — Save Assessment Answer"),
    RESOLVE_NEXT: createSubflow("SUBFLOW 08 — Resolve Next Assessment State"),
    RENDER_MSG: createSubflow("SUBFLOW 09 — Render Assessment Message")
};

// ==========================================
// TABS 01 & 02 BASE
// ==========================================
const t1_in = { id: generateId(), z: TABS.WEBHOOKS, type: "http in", name: "Incoming Webhook", url: "/webhooks/evolution/messages", method: "post", x: 150, y: 100, wires: [[]] };
const t1_out = { id: generateId(), z: TABS.WEBHOOKS, type: "http response", name: "HTTP 200", statusCode: "200", x: 550, y: 100, wires: [] };
const t1_link = { id: generateId(), z: TABS.WEBHOOKS, type: "link out", name: "To Router", links: [], x: 550, y: 150, wires: [] };
t1_in.wires[0].push(t1_out.id, t1_link.id);
nodes.push(t1_in, t1_out, t1_link);

const t2_in = { id: generateId(), z: TABS.ROUTER, type: "link in", name: "From Webhook", links: [t1_link.id], x: 100, y: 100, wires: [[]] };
t1_link.links.push(t2_in.id);
const t2_norm = { id: generateId(), z: TABS.ROUTER, type: `subflow:${SUBFLOWS.NORMALIZE}`, name: "Normalize Event", x: 250, y: 100, wires: [[]] };
const t2_guard = { id: generateId(), z: TABS.ROUTER, type: `subflow:${SUBFLOWS.GUARD}`, name: "Duplicate Guard", x: 450, y: 100, wires: [[]] };
const t2_write = { id: generateId(), z: TABS.ROUTER, type: `subflow:${SUBFLOWS.WRITE_MSG}`, name: "Write Message", x: 650, y: 100, wires: [[]] };
const t2_lead = { id: generateId(), z: TABS.ROUTER, type: `subflow:${SUBFLOWS.RESOLVE_LEAD}`, name: "Resolve Lead", x: 250, y: 200, wires: [[]] };
const t2_session = { id: generateId(), z: TABS.ROUTER, type: `subflow:${SUBFLOWS.RESOLVE_SESSION}`, name: "Resolve Session", x: 450, y: 200, wires: [[]] };

const t2_route = { id: generateId(), z: TABS.ROUTER, type: "function", name: "Determine Route", 
    func: `let text = msg.coverscore.text_normalized;\nconst hasSession = Boolean(msg.coverscore.session_id);\nlet route = 'unknown_message';\n\nconst familyMatch = text.match(/^FAMILY(?:\\s+([A-Z0-9_:-]+))?$/);\nif (familyMatch) {\n  route = 'command_start';\n  msg.coverscore.campaign_code = familyMatch[1] || 'ORGANIC';\n} else {\n  const commands = { START: 'command_start', CONTINUE: 'command_continue', PAUSE: 'command_pause', RESTART: 'command_restart', STOP: 'command_stop', HELP: 'command_help', REPORT: 'command_report', ADVISOR: 'command_advisor' };\n  route = commands[text] || (hasSession ? 'assessment_answer' : 'unknown_message');\n}\n\nmsg.coverscore.route = route;\nreturn msg;`, 
    outputs: 1, x: 650, y: 200, wires: [[]] 
};
const t2_switch = { id: generateId(), z: TABS.ROUTER, type: "switch", name: "Route Switch",
    property: "coverscore.route", propertyType: "msg",
    rules: [
        {t: "eq", v: "command_start", vt: "str"},
        {t: "eq", v: "command_continue", vt: "str"},
        {t: "eq", v: "command_pause", vt: "str"},
        {t: "eq", v: "command_stop", vt: "str"},
        {t: "eq", v: "command_help", vt: "str"},
        {t: "eq", v: "assessment_answer", vt: "str"},
        {t: "eq", v: "unknown_message", vt: "str"}
    ], checkall: "true", repair: false, outputs: 7, x: 850, y: 200, wires: [[],[],[],[],[],[],[]]
};

const l_start = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "command_start", links: [], x: 1050, y: 100, wires: [] };
const l_continue = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "command_continue", links: [], x: 1050, y: 140, wires: [] };
const l_pause = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "command_pause", links: [], x: 1050, y: 180, wires: [] };
const l_stop = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "command_stop", links: [], x: 1050, y: 220, wires: [] };
const l_help = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "command_help", links: [], x: 1050, y: 260, wires: [] };
const l_answer = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "assessment_answer", links: [], x: 1050, y: 300, wires: [] };
const l_unknown = { id: generateId(), z: TABS.ROUTER, type: "link out", name: "unknown_message", links: [], x: 1050, y: 340, wires: [] };

t2_in.wires[0].push(t2_norm.id);
t2_norm.wires[0].push(t2_guard.id);
t2_guard.wires[0].push(t2_write.id);
t2_write.wires[0].push(t2_lead.id);
t2_lead.wires[0].push(t2_session.id);
t2_session.wires[0].push(t2_route.id);
t2_route.wires[0].push(t2_switch.id);

t2_switch.wires[0].push(l_start.id);
t2_switch.wires[1].push(l_continue.id);
t2_switch.wires[2].push(l_pause.id);
t2_switch.wires[3].push(l_stop.id);
t2_switch.wires[4].push(l_help.id);
t2_switch.wires[5].push(l_answer.id);
t2_switch.wires[6].push(l_unknown.id);

nodes.push(t2_in, t2_norm, t2_guard, t2_write, t2_lead, t2_session, t2_route, t2_switch, l_start, l_continue, l_pause, l_stop, l_help, l_answer, l_unknown);

// ==========================================
// HELPER: Link Subflow nodes
// ==========================================
function linkSubflow(sfId, internalNodes) {
    const sfDef = nodes.find(n => n.id === sfId && n.type === "subflow");
    const inNode = nodes.find(n => n.z === sfId && n.direction === "in");
    const outNode = nodes.find(n => n.z === sfId && n.direction === "out");
    if (!sfDef || !inNode || !outNode) return;
    
    // Attach first internal node to the IN port's wires
    inNode.wires[0].push(internalNodes[0].id);
    
    // Attach last internal node to the OUT port
    internalNodes[internalNodes.length - 1].wires[0].push(outNode.id);
    
    nodes.push(...internalNodes);
}

// ==========================================
// POPULATE SUBFLOWS WITH PROPER WIRING
// ==========================================

// SUBFLOW 01 - Normalize Event
const sf1_1 = { id: generateId(), z: SUBFLOWS.NORMALIZE, type: "function", name: "Normalize Logic",
    func: `const body = msg.payload;\nconst data = body.data || body;\nconst key = data.key || {};\nconst message = data.message || {};\nconst text = message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || '';\nconst messageType = message.conversation ? 'text' : message.extendedTextMessage ? 'text' : 'unsupported';\nconst remoteJid = key.remoteJid || '';\nconst fromNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');\nmsg.coverscore = {\n  request_id: body.id || 'req-id',\n  event_type: 'incoming_message',\n  organization_code: env.get('COVERSCORE_ORGANIZATION_CODE') || 'coverscore',\n  instance_name: body.instance || 'coverscore-main',\n  message_id: key.id || data.id,\n  from_number: fromNumber,\n  text_original: text,\n  text_normalized: String(text).trim().toUpperCase(),\n  message_type: messageType,\n  timestamp: new Date().toISOString()\n};\nmsg.payload = msg.coverscore;\nreturn msg;`,
    outputs: 1, x: 250, y: 50, wires: [[]]
};
linkSubflow(SUBFLOWS.NORMALIZE, [sf1_1]);

// SUBFLOW 02 - Duplicate Guard
const sf2_1 = { id: generateId(), z: SUBFLOWS.GUARD, type: "function", name: "Set Params", func: `msg.payload = [msg.coverscore.message_id, msg.coverscore.instance_name];\nreturn msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf2_2 = { id: generateId(), z: SUBFLOWS.GUARD, type: "postgres", postgresdb: pgConfig.id, name: "Check Duplicates", query: `SELECT id FROM conversation_messages WHERE evolution_message_id = $1 AND evolution_instance_name = $2 LIMIT 1;`, output: true, outputs: 1, x: 400, y: 50, wires: [[]] };
sf2_1.wires[0].push(sf2_2.id);
linkSubflow(SUBFLOWS.GUARD, [sf2_1, sf2_2]);

// SUBFLOW 03 - Resolve Lead
const sf3_1 = { id: generateId(), z: SUBFLOWS.RESOLVE_LEAD, type: "function", name: "Set Find Params", func: `msg.payload = [msg.coverscore.organization_code, msg.coverscore.from_number];\nreturn msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf3_2 = { id: generateId(), z: SUBFLOWS.RESOLVE_LEAD, type: "postgres", postgresdb: pgConfig.id, name: "Find Lead", query: `SELECT * FROM leads WHERE organization_id = (SELECT id FROM organizations WHERE code = $1) AND whatsapp_number = $2 AND deleted_at IS NULL LIMIT 1;`, output: true, outputs: 1, x: 400, y: 50, wires: [[]] };
sf3_1.wires[0].push(sf3_2.id);
linkSubflow(SUBFLOWS.RESOLVE_LEAD, [sf3_1, sf3_2]);

// SUBFLOW 04 - Resolve Session
const sf4_1 = { id: generateId(), z: SUBFLOWS.RESOLVE_SESSION, type: "function", name: "Set Params", func: `msg.payload = [msg.coverscore.lead_id];\nreturn msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf4_2 = { id: generateId(), z: SUBFLOWS.RESOLVE_SESSION, type: "postgres", postgresdb: pgConfig.id, name: "Find Session", query: `SELECT s.* FROM assessment_sessions s JOIN assessment_templates t ON t.id = s.assessment_template_id WHERE s.lead_id = $1 AND t.code = 'family_protection_score' AND t.version = 1 AND s.status IN ('new', 'in_progress', 'paused', 'processing') ORDER BY s.created_at DESC LIMIT 1;`, output: true, outputs: 1, x: 400, y: 50, wires: [[]] };
sf4_1.wires[0].push(sf4_2.id);
linkSubflow(SUBFLOWS.RESOLVE_SESSION, [sf4_1, sf4_2]);

// SUBFLOW 05 - Send WhatsApp Message
const sf5_1 = { id: generateId(), z: SUBFLOWS.SEND_MSG, type: "function", name: "Prepare Payload", func: `msg.payload = { number: msg.coverscore.to_number || msg.coverscore.from_number, text: msg.coverscore.outbound_text };\nreturn msg;`, outputs: 1, x: 250, y: 50, wires: [[]] };
const sf5_2 = { id: generateId(), z: SUBFLOWS.SEND_MSG, type: "http request", name: "Evolution API", method: "POST", ret: "obj", url: "http://evolution:8080/message/sendText/${EVOLUTION_INSTANCE_NAME}", x: 450, y: 50, wires: [[]] };
sf5_1.wires[0].push(sf5_2.id);
linkSubflow(SUBFLOWS.SEND_MSG, [sf5_1, sf5_2]);

// SUBFLOW 06 - Write Message
const sf6_1 = { id: generateId(), z: SUBFLOWS.WRITE_MSG, type: "function", name: "Set Params", func: `msg.payload = [\n  msg.coverscore.instance_name,\n  msg.coverscore.message_id,\n  msg.coverscore.message_type,\n  msg.coverscore.text_original,\n  JSON.stringify(msg.coverscore.raw_payload),\n  msg.coverscore.organization_code\n];\nreturn msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf6_2 = { id: generateId(), z: SUBFLOWS.WRITE_MSG, type: "postgres", postgresdb: pgConfig.id, name: "Insert Message", query: `INSERT INTO conversation_messages (organization_id, evolution_instance_name, evolution_message_id, direction, message_type, content, raw_payload, delivery_status, created_at) SELECT id, $1, $2, 'inbound', $3, $4, $5::jsonb, 'received', now() FROM organizations WHERE code = $6 RETURNING id;`, output: false, outputs: 1, x: 400, y: 50, wires: [[]] };
sf6_1.wires[0].push(sf6_2.id);
linkSubflow(SUBFLOWS.WRITE_MSG, [sf6_1, sf6_2]);

// SUBFLOW 07 - Save Assessment Answer
const sf7_1 = { id: generateId(), z: SUBFLOWS.SAVE_ANS, type: "function", name: "Set Answer Params", func: `msg.payload = [msg.coverscore.session_id, 'todo_qcode', msg.coverscore.answer_key, msg.coverscore.answer_value, msg.coverscore.answer_label, msg.coverscore.risk_value, msg.coverscore.text_original]; return msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf7_2 = { id: generateId(), z: SUBFLOWS.SAVE_ANS, type: "postgres", postgresdb: pgConfig.id, name: "Save Answer", query: `INSERT INTO assessment_answers (assessment_session_id, question_code, answer_key, answer_value, answer_label, risk_value, raw_reply, answered_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now()) ON CONFLICT (assessment_session_id, question_code) DO UPDATE SET answer_key = EXCLUDED.answer_key RETURNING *;`, output: false, outputs: 1, x: 400, y: 50, wires: [[]] };
sf7_1.wires[0].push(sf7_2.id);
linkSubflow(SUBFLOWS.SAVE_ANS, [sf7_1, sf7_2]);

// SUBFLOW 08 - Resolve Next Assessment State
const sf8_1 = { id: generateId(), z: SUBFLOWS.RESOLVE_NEXT, type: "function", name: "Set Resolve Params", func: `msg.payload = [msg.coverscore.session_id, msg.coverscore.current_state_code]; return msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf8_2 = { id: generateId(), z: SUBFLOWS.RESOLVE_NEXT, type: "postgres", postgresdb: pgConfig.id, name: "Fetch State Config", query: `SELECT st.transition_config, st.state_type FROM assessment_sessions s JOIN assessment_states st ON st.assessment_template_id = s.assessment_template_id AND st.state_code = $2 WHERE s.id = $1 LIMIT 1;`, output: true, outputs: 1, x: 400, y: 50, wires: [[]] };
const sf8_3 = { id: generateId(), z: SUBFLOWS.RESOLVE_NEXT, type: "function", name: "Compute Next State", func: `msg.coverscore.next_state_code = 'FAM_EDU_RESPONSIBILITY'; // MVP Hardcoded fallback\nreturn msg;`, outputs: 1, x: 600, y: 50, wires: [[]] };
sf8_1.wires[0].push(sf8_2.id);
sf8_2.wires[0].push(sf8_3.id);
linkSubflow(SUBFLOWS.RESOLVE_NEXT, [sf8_1, sf8_2, sf8_3]);

// SUBFLOW 09 - Render Message
const sf9_1 = { id: generateId(), z: SUBFLOWS.RENDER_MSG, type: "function", name: "Set Params", func: `msg.payload = [msg.coverscore.current_state_code];\nreturn msg;`, outputs: 1, x: 200, y: 50, wires: [[]] };
const sf9_2 = { id: generateId(), z: SUBFLOWS.RENDER_MSG, type: "postgres", postgresdb: pgConfig.id, name: "Load Template", query: `SELECT message_template FROM assessment_states WHERE state_code = $1 AND is_active = true LIMIT 1;`, output: true, outputs: 1, x: 400, y: 50, wires: [[]] };
const sf9_3 = { id: generateId(), z: SUBFLOWS.RENDER_MSG, type: "function", name: "Render", func: `if (msg.payload && msg.payload.length > 0) {\n  let text = msg.payload[0].message_template;\n  text = text.replace('{{first_name}}', msg.coverscore.display_name || 'there');\n  msg.coverscore.outbound_text = text;\n}\nreturn msg;`, outputs: 1, x: 600, y: 50, wires: [[]] };
sf9_1.wires[0].push(sf9_2.id);
sf9_2.wires[0].push(sf9_3.id);
linkSubflow(SUBFLOWS.RENDER_MSG, [sf9_1, sf9_2, sf9_3]);

// ==========================================
// TAB 03: ASSESSMENT (Flows)
// ==========================================

// Flow 03.1 — Start Assessment
const t3_start_in = { id: generateId(), z: TABS.ASSESSMENT, type: "link in", name: "command_start", links: [l_start.id], x: 100, y: 100, wires: [[]] };
l_start.links.push(t3_start_in.id);

const t3_create_session_params = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Set Create Params", func: `msg.payload = [msg.coverscore.lead_id, msg.coverscore.instance_name];\nreturn msg;`, outputs: 1, x: 300, y: 100, wires: [[]] };
const t3_create_session_db = { id: generateId(), z: TABS.ASSESSMENT, type: "postgres", postgresdb: pgConfig.id, name: "Create Session", query: `INSERT INTO assessment_sessions (organization_id, lead_id, assessment_template_id, evolution_instance_name, status, current_state_code, started_at, last_activity_at) SELECT o.id, $1, t.id, $2, 'in_progress', t.initial_state_code, now(), now() FROM organizations o JOIN assessment_templates t ON t.organization_id = o.id WHERE o.code = 'coverscore' AND t.code = 'family_protection_score' AND t.version = 1 ON CONFLICT DO NOTHING RETURNING *;`, output: true, outputs: 1, x: 500, y: 100, wires: [[]] };
const t3_start_msg = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Welcome Message", func: `msg.coverscore.outbound_text = "Welcome to CoverScore Personal™.\\n\\nThis short Family Protection Score™ helps you reflect on how prepared your household may be for unexpected changes involving income, health, family responsibilities, and education expenses.\\n\\nIt takes about 3 minutes.\\n\\nReply 1 to begin.\\nReply PAUSE at any time to continue later.\\nReply STOP to end.\\n\\nYour answers are used to generate your private protection report. Please do not send passwords, bank details, BVN, NIN, or card information.";\nreturn msg;`, outputs: 1, x: 700, y: 100, wires: [[]] };
const t3_send_msg = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.SEND_MSG}`, name: "Send WhatsApp", x: 900, y: 100, wires: [[]] };

t3_start_in.wires[0].push(t3_create_session_params.id);
t3_create_session_params.wires[0].push(t3_create_session_db.id);
t3_create_session_db.wires[0].push(t3_start_msg.id);
t3_start_msg.wires[0].push(t3_send_msg.id);
nodes.push(t3_start_in, t3_create_session_params, t3_create_session_db, t3_start_msg, t3_send_msg);

// Flow 03.4 — Stop Assessment
const t3_stop_in = { id: generateId(), z: TABS.ASSESSMENT, type: "link in", name: "command_stop", links: [l_stop.id], x: 100, y: 200, wires: [[]] };
l_stop.links.push(t3_stop_in.id);
const t3_stop_params = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Set Stop Params", func: `msg.payload = [msg.coverscore.session_id, msg.coverscore.lead_id];\nreturn msg;`, outputs: 1, x: 300, y: 200, wires: [[]] };
const t3_stop_db = { id: generateId(), z: TABS.ASSESSMENT, type: "postgres", postgresdb: pgConfig.id, name: "Stop Session & Opt-Out", query: `UPDATE assessment_sessions SET status = 'stopped', stopped_at = now(), last_activity_at = now() WHERE id = $1; UPDATE leads SET whatsapp_opt_out = true, status = 'opted_out', updated_at = now() WHERE id = $2;`, output: false, outputs: 1, x: 500, y: 200, wires: [[]] };
const t3_stop_msg = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Stop Message", func: `msg.coverscore.outbound_text = "Your CoverScore assessment has been stopped.\\n\\nYou will not receive further assessment reminders.\\n\\nIf you choose to return later, reply START.";\nreturn msg;`, outputs: 1, x: 700, y: 200, wires: [[]] };
const t3_stop_send = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.SEND_MSG}`, name: "Send WhatsApp", x: 900, y: 200, wires: [[]] };

t3_stop_in.wires[0].push(t3_stop_params.id);
t3_stop_params.wires[0].push(t3_stop_db.id);
t3_stop_db.wires[0].push(t3_stop_msg.id);
t3_stop_msg.wires[0].push(t3_stop_send.id);
nodes.push(t3_stop_in, t3_stop_params, t3_stop_db, t3_stop_msg, t3_stop_send);

// Flow 03.7 — Validate Assessment Answer
const t3_ans_in = { id: generateId(), z: TABS.ASSESSMENT, type: "link in", name: "assessment_answer", links: [l_answer.id], x: 100, y: 300, wires: [[]] };
l_answer.links.push(t3_ans_in.id);
const t3_ans_params = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Set Load Params", func: `msg.payload = [msg.coverscore.session_id];\nreturn msg;`, outputs: 1, x: 250, y: 300, wires: [[]] };
const t3_ans_db = { id: generateId(), z: TABS.ASSESSMENT, type: "postgres", postgresdb: pgConfig.id, name: "Load Current State", query: `SELECT s.id AS session_id, s.current_state_code, st.question_code, st.message_template, st.input_type, st.accepted_inputs, st.validation_config, st.transition_config, st.invalid_message_template FROM assessment_sessions s JOIN assessment_states st ON st.state_code = s.current_state_code JOIN assessment_templates t ON t.id = s.assessment_template_id WHERE s.id = $1 AND st.assessment_template_id = t.id LIMIT 1;`, output: true, outputs: 1, x: 450, y: 300, wires: [[]] };
const t3_ans_val = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Validate Reply", func: `const state = msg.payload[0];\nconst reply = msg.coverscore.text_normalized;\nconst accepted = Array.isArray(state.accepted_inputs) ? state.accepted_inputs : JSON.parse(state.accepted_inputs || '[]');\nlet valid = false; let answerKey = null;\nif (state.input_type === 'single_select') { valid = accepted.includes(reply); answerKey = reply; }\nmsg.coverscore.answer_valid = valid;\nmsg.coverscore.answer_key = answerKey;\nreturn msg;`, outputs: 1, x: 650, y: 300, wires: [[]] };
const t3_ans_switch = { id: generateId(), z: TABS.ASSESSMENT, type: "switch", name: "Valid?", property: "coverscore.answer_valid", propertyType: "msg", rules: [{t: "true"}, {t: "false"}], outputs: 2, x: 800, y: 300, wires: [[], []] };
const t3_save_ans = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.SAVE_ANS}`, name: "Save Answer", x: 950, y: 280, wires: [[]] };
const t3_res_next = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.RESOLVE_NEXT}`, name: "Resolve Next", x: 1100, y: 280, wires: [[]] };
const t3_render_msg = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.RENDER_MSG}`, name: "Render State", x: 1250, y: 280, wires: [[]] };
const t3_send_next = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.SEND_MSG}`, name: "Send WhatsApp", x: 1400, y: 280, wires: [[]] };

const t3_invalid_msg = { id: generateId(), z: TABS.ASSESSMENT, type: "function", name: "Invalid Msg", func: `msg.coverscore.outbound_text = "Please reply with one of the listed options.\\n\\nFor example, reply:\\n\\n1";\nreturn msg;`, outputs: 1, x: 950, y: 320, wires: [[]] };
const t3_send_invalid = { id: generateId(), z: TABS.ASSESSMENT, type: `subflow:${SUBFLOWS.SEND_MSG}`, name: "Send WhatsApp", x: 1100, y: 320, wires: [[]] };

t3_ans_in.wires[0].push(t3_ans_params.id);
t3_ans_params.wires[0].push(t3_ans_db.id);
t3_ans_db.wires[0].push(t3_ans_val.id);
t3_ans_val.wires[0].push(t3_ans_switch.id);

t3_ans_switch.wires[0].push(t3_save_ans.id); // Valid
t3_save_ans.wires[0].push(t3_res_next.id);
t3_res_next.wires[0].push(t3_render_msg.id);
t3_render_msg.wires[0].push(t3_send_next.id);

t3_ans_switch.wires[1].push(t3_invalid_msg.id); // Invalid
t3_invalid_msg.wires[0].push(t3_send_invalid.id);

nodes.push(t3_ans_in, t3_ans_params, t3_ans_db, t3_ans_val, t3_ans_switch, t3_save_ans, t3_res_next, t3_render_msg, t3_send_next, t3_invalid_msg, t3_send_invalid);

// Write to flows.json
fs.writeFileSync(path.join(__dirname, '../node-red/flows.json'), JSON.stringify(nodes, null, 2));
console.log('flows.json generated successfully.');
