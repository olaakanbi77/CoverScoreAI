# Development Roadmap

## Phase 1: Foundation ✅ (Complete)

- [x] Express server with routing
- [x] SQLite/PostgreSQL database abstraction
- [x] JWT authentication + RBAC
- [x] Handlebars templating engine
- [x] Static file serving
- [x] Error handling middleware
- [x] Rate limiting
- [x] Helmet security headers

## Phase 2: WhatsApp Assessment Engine ✅ (Complete)

- [x] Evolution API webhook integration
- [x] CCIE conversation engine
- [x] Question bank (7 business + 7 personal industries)
- [x] Answer validation
- [x] State persistence (chat history, assessment data)
- [x] Multi-prefix routing
- [x] Session resume across disconnections
- [x] RESTART handling

## Phase 3: Scoring & Reporting ✅ (Complete)

- [x] Scoring engine (calculateScore)
- [x] CSNS 6-tier risk classification
- [x] Pillar-level scoring
- [x] Domain configuration (whyTexts, recommendationTexts, firstStepTexts)
- [x] AI report generation (generateRiskReport)
- [x] Report section sequence (Score → Insight → Strengths → Risk Story → Forecast → CTA)
- [x] WhatsApp message splitting (msg3a + msg3b)
- [x] Premium estimation
- [x] Lead qualification AI

## Phase 4: Risk Intelligence Engine (RIE) ✅ (Complete)

- [x] Layer 9: Product Mapper
- [x] Layer 10: Opportunity Scorer
- [x] Layer 11: Advisor Copilot
- [x] Layer 12: Quote Pre-Builder
- [x] Layer 13: Follow-Up Engine
- [x] Layer 14: Learning Engine
- [x] Wired into webhook post-assessment

## Phase 5: Database Architecture ✅ (Complete)

- [x] RIE Data Model (20 tables)
- [x] Migration scripts (001-005)
- [x] Migration runner
- [x] DB access layer
- [x] Cross-SQLite/PostgreSQL compatibility
- [x] Renewals table

## Phase 6: AI Prompt Library ✅ (Complete)

- [x] 10 prompt templates
- [x] renderPrompt() entry point
- [x] Risk Story prompt
- [x] Insight prompt
- [x] Copilot Brief prompt
- [x] Quote Explanation prompt
- [x] Proposal prompt
- [x] Renewal prompt
- [x] Cross-sell prompt
- [x] Objection Handling prompt
- [x] Follow-up prompt
- [x] Strengths prompt

## Phase 7: Product Knowledge Base ✅ (Complete)

- [x] 17 insurance products with Nigerian-market data
- [x] Product descriptions, risks, exclusions
- [x] Local claim examples (NGN)
- [x] Objection responses
- [x] Cross-sell mappings
- [x] Risk-to-product mappings for RIE

## Phase 8: Proposal Engine ✅ (Complete)

- [x] HTML proposal template
- [x] PDF generator (html-pdf-node with graceful fallback)
- [x] Route: POST /api/proposals/generate-pdf
- [x] Route: POST /api/proposals/generate (AI draft)
- [x] Route: POST /api/proposals/save
- [x] Route: GET /api/proposals/view/:token
- [x] Route: POST /api/proposals/:token/action
- [x] Route: POST /api/proposals/send (WhatsApp + Email)

## Phase 9: Renewal Engine ✅ (Complete)

- [x] checkExpiringPolicies() — 90-day window
- [x] triggerReassessment() — new assessment session
- [x] generateRenewalProposal() — premium adjustment
- [x] sendReminder() — multi-channel (WhatsApp + Email)
- [x] processDecision() — approve/decline
- [x] getRenewalPipeline() — advisor dashboard
- [x] Daily scheduler (auto-run on boot + 24h interval)
- [x] Route: GET /api/renewals
- [x] Route: GET /api/renewals/pipeline
- [x] Route: GET /api/renewals/check
- [x] Route: POST /api/renewals/:id/reassess
- [x] Route: POST /api/renewals/:id/generate-proposal
- [x] Route: POST /api/renewals/:id/decision
- [x] Post-assessment renewal check in webhook

## Phase 10: Analytics Engine ✅ (Complete)

- [x] 12 parameterized SQL queries
- [x] Report generator (weekly advisor, monthly overview, funnel health, deep-dive)
- [x] Route: GET /api/analytics/query/:name
- [x] Route: GET /api/analytics/report/weekly
- [x] Route: GET /api/analytics/report/monthly
- [x] Route: GET /api/analytics/report/funnel-health
- [x] Route: GET /api/analytics/report/assessment/:id
- [x] Dashboard overview route
- [x] Risk distribution, conversion, pipeline, trends routes

## Phase 11: Engineering Specifications ✅ (Complete)

- [x] Product Vision (00)
- [x] Product Requirements Document (01)
- [x] System Architecture (02)
- [x] Database Schema (03)
- [x] API Specification (04)
- [x] Business Rules (05)
- [x] Risk Intelligence Engine (06)
- [x] Assessment Engine (07)
- [x] Advisor OS (08)
- [x] UI Components (09)
- [x] State Machines (10)
- [x] AI Prompts (11)
- [x] Node-RED Workflows (12)
- [x] Security (13)
- [x] Testing Strategy (14)
- [x] Development Roadmap (15)

## Phase 12: Deployment & Polish 🔜 (Next)

- [ ] Deploy full stack — `git pull && pm2 restart coverscore --update-env`
- [ ] Run database migrations on production
- [ ] Verify WhatsApp end-to-end flow
- [ ] Verify analytics routes return correct data
- [ ] Verify PDF proposal generation
- [ ] Verify renewal scheduler creates records
- [ ] Set up automated backups
- [ ] Configure monitoring (PM2 metrics, uptime checks)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Load testing (100+ concurrent assessments)

## Phase 13: Enhancement 🔜 (Future)

- [ ] Node-RED deployment + flow configuration
- [ ] Admin analytics dashboard UI (charts, filters, export)
- [ ] Advisor mobile app (React Native or Flutter)
- [ ] Multi-language support (Pidgin, Yoruba, Hausa, Igbo)
- [ ] Payment gateway integration (Paystack)
- [ ] Document management system (policy docs upload)
- [ ] Automated underwriting rules engine
- [ ] Insurance partner API integration
- [ ] Real-time chat between advisor and client
- [ ] Client self-service portal
