# System Architecture

## 1. High-Level Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   End User   │◄───►│  WhatsApp /   │◄───►│  CoverScore API  │
│  (WhatsApp)  │     │  Evolution API │     │  (Express/Node)  │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          │                        │                        │
                          ▼                        ▼                        ▼
                   ┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
                   │   SQLite /    │       │   AI Engine   │       │   RIE Engine     │
                   │  PostgreSQL   │       │  (OpenAI/GPT) │       │  (Risk Intel)    │
                   └──────────────┘       └──────────────┘       └──────────────────┘
                          │                                             │
                          └──────────────────┬──────────────────────────┘
                                             ▼
                                   ┌──────────────────┐
                                   │   Node-RED        │
                                   │  (Automation)     │
                                   └──────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Runtime | Node.js 18+ (Express) | Fast I/O, same-language full stack, large ecosystem |
| Database | SQLite (dev) / PostgreSQL (prod) | SQLite for zero-config dev; PG for production scale |
| WhatsApp | Evolution API | Self-hosted, full WhatsApp Business API features |
| AI | OpenAI GPT-4 / Claude | Best-in-class for risk narrative generation |
| Auth | JWT + bcrypt | Stateless, secure, simple |
| Frontend | Express Handlebars (HBS) | Server-rendered, SEO-friendly, minimal JS |
| Automation | Node-RED (planned) | Visual workflow editor, integrates with everything |
| PDF | html-pdf-node / puppeteer | HTML-to-PDF with CSS styling |

## 3. Module Map

```
src/
├── app.js                    # Express app entry
├── server.js                 # HTTP server start
├── config/
│   ├── database.js           # DB abstraction (SQLite + PG)
│   └── domain.js             # Domain config (industry texts, whyTexts, etc.)
├── routes/
│   ├── webhook.js            # WhatsApp webhook (main assessment flow)
│   ├── auth.js               # Authentication
│   ├── assessment.js         # Assessment CRUD
│   ├── leads.js              # Lead management
│   ├── admin.js              # Admin endpoints
│   ├── analytics.js          # Analytics endpoints
│   ├── proposals.js          # Proposal CRUD + PDF generation
│   ├── renewals.js           # Renewal CRUD + pipeline
│   ├── advisor.js            # Advisor dashboard routes
│   ├── crm.js                # CRM endpoints
│   └── public.js             # Public page routes
├── services/
│   ├── whatsappService.js    # WhatsApp send abstraction
│   ├── emailService.js       # Email send (Nodemailer)
│   ├── aiService.js          # AI report generation
│   ├── scoringEngine.js      # Score calculation
│   ├── cre.js                # Contextual recommendation engine
│   ├── ccieEngine.js         # Conversation engine (CCIE)
│   └── ccieEvents.js         # Event pub/sub
├── rie/
│   ├── index.js              # Risk Intelligence Engine
│   ├── productMapper.js      # Layer 9: Product mapping
│   ├── quoteBuilder.js       # Layer 12: Quote pre-building
│   ├── followUpEngine.js     # Layer 13: Follow-up automation
│   └── learningEngine.js     # Layer 14: Learning from outcomes
├── proposals/
│   ├── index.js              # Proposal engine entry
│   ├── generator.js          # Proposal generation logic
│   └── templates/
│       └── proposal.html     # HTML proposal template
├── renewals/
│   ├── index.js              # Renewal engine entry
│   ├── engine.js             # Core renewal logic
│   └── scheduler.js          # Daily renewal check
├── analytics/
│   ├── index.js              # Analytics entry
│   ├── queries.js            # Parameterized SQL queries
│   └── reports.js            # Composite report generators
├── prompts/
│   ├── index.js              # Prompt renderer
│   ├── risk-story.md         # Risk Story prompt
│   ├── insight.md            # CoverScore Insight prompt
│   ├── copilot-brief.md      # Advisor Copilot Brief prompt
│   ├── quote-explanation.md  # Quote explanation prompt
│   ├── proposal.md           # Proposal generation prompt
│   ├── renewal.md            # Renewal notification prompt
│   ├── cross-sell.md         # Cross-sell prompt
│   ├── objection.md          # Objection handling prompt
│   ├── follow-up.md          # Follow-up message prompt
│   └── strengths.md          # Strengths identification prompt
├── knowledge/
│   ├── index.js              # Knowledge base query
│   └── products.json         # 17 insurance products with Nigerian data
├── data/
│   ├── question_bank.json    # Assessment questions
│   ├── industry_content.json # Industry landing page content
│   └── domain.js → config/
├── middleware/
│   ├── auth.js               # JWT authentication
│   ├── errorHandler.js       # Error handling
│   └── rbac.js               # Role-based access control
├── views/                    # Handlebars templates
│   ├── layouts/
│   ├── partials/
│   ├── admin/
│   ├── advisor/
│   ├── auth/
│   ├── assessment/
│   ├── public/
│   └── landing pages
├── public/                   # Static assets (CSS, JS, images)
│   └── proposals/            # Generated PDFs/HTMLs
└── database/                 # Migration scripts
    ├── migrate.js
    ├── 001_assessments.sql
    ├── 002_leads.sql
    ├── 003_policies.sql
    ├── 004_opportunities.sql
    └── 005_audit_logs.sql
```

## 4. Data Flow: Assessment Completion

```
User answers last question
       │
       ▼
CCIE determines: isComplete = true
       │
       ▼
Phase 1: Send auto_advance messages
       │
       ▼
Phase 2: Run calculateScore(answers)
   ├── Score computed (0-100)
   ├── Risk categories calculated
   ├── Assessment record created
   ├── reportUrl generated
   └── Background setImmediate block fires:
       ├── AI report generation (generateRiskReport)
       ├── Email report to user
       ├── Estimated premium calculation
       ├── Lead record updated (score, status, pipeline)
       ├── Renewal engine checks expiring policies
       └── RIE runs (opportunity score, products, copilot)
       │
       ▼
Phase 3: Build ending sequence
   ├── Message 1: Score + Summary + Highest Priority
   ├── Message 2: Risk Pillars + Insight
   ├── Message 3a: What You're Doing Well + Risk Story + If Nothing Changes
   ├── Message 3b: Forecast + Improvement + First Step + Report
   └── Message 4: Advisor CTA
       │
       ▼
Phase 4: Send messages with delays
       │
       ▼
State saved → lead transitions to 'awaiting_consultation'
```

## 5. Infrastructure

### Development
- Node.js local server
- SQLite file database
- Evolution API Docker (local or staging)
- Ngrok for webhook tunneling

### Production
- PM2 process manager
- PostgreSQL (managed)
- Nginx reverse proxy (SSL termination)
- Evolution API (self-hosted VPS)
- Automated backups (daily)

### Environment Variables
```
APP_URL
DATABASE_URL (optional, falls back to SQLite)
DB_PATH
JWT_SECRET
ADMIN_EMAIL / ADMIN_PASSWORD
WHATSAPP_BOT_NUMBER
EVOLUTION_API_URL / EVOLUTION_API_KEY
SMTP_SERVICE / SMTP_USER / SMTP_PASS
OPENAI_API_KEY
```
