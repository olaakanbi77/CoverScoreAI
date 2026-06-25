# CoverScore WhatsApp End-to-End QA Test Suite™ v1
Quality Assurance Specification for CoverScore Personal™

Assessment: Family Protection Score™
Channels: WhatsApp, Advisor OS, Report Viewer
Workflow: Node-RED + PostgreSQL + Evolution API
Purpose: Verify the complete lead-to-advisor journey before pilot launch.

## 1. QA Objective

This test suite confirms that CoverScore works correctly from the moment a lead enters through social media or a referral link until the opportunity is assigned to an advisor and followed up appropriately.

Lead enters WhatsApp
↓
Assessment begins
↓
Answers are validated and saved
↓
Assessment is scored
↓
Report is generated and delivered
↓
Advisor consent is captured
↓
Opportunity is created
↓
Advisor is assigned
↓
Follow-up task is created
↓
Advisor works the opportunity

## 2. Test Environments
| Environment | Purpose | Data Rule |
|-------------|---------|-----------|
| Development | Developer testing during build | Test data only |
| Staging | Full workflow and integration testing | Test WhatsApp numbers only |
| Pilot Production | Controlled real-user pilot | Real data with consent |
| Production | Full public launch | Live data and monitored operations |

### Environment Requirements
* Separate PostgreSQL database for each environment
* Separate Evolution API instance for staging and production
* Separate Node-RED projects or deployments
* Separate report-service storage bucket or folder
* Separate advisor test accounts
* Separate secure report base URLs

## 3. Test Roles and Personas
| Persona | Description |
|---------|-------------|
| New Lead | Has never interacted with CoverScore |
| Returning Lead | Has an existing completed assessment |
| Active Lead | Currently completing an assessment |
| Paused Lead | Paused assessment intentionally |
| Abandoned Lead | Did not complete assessment after reminders |
| Opted-Out Lead | Sent STOP and should receive no reminders |
| High-Gap Lead | Receives urgent or high priority score |
| Standard Lead | Receives standard priority score |
| Advisor | Receives assigned opportunities |
| Team Lead | Assigns and reassigns opportunities |
| Operations Manager | Reviews queues and SLA compliance |
| Admin | Configures templates and users |
| System Monitor | Reviews alerts, logs, and failures |

## 4. Test Data Setup

Create controlled test accounts and WhatsApp numbers.

| Test Lead | WhatsApp Number | Intended Scenario |
|-----------|-----------------|-------------------|
| TEST_NEW_01 | Test number 1 | New assessment |
| TEST_PAUSE_01 | Test number 2 | Pause and resume |
| TEST_INVALID_01 | Test number 3 | Invalid answers |
| TEST_HIGH_01 | Test number 4 | High protection gap |
| TEST_STANDARD_01 | Test number 5 | Standard protection gap |
| TEST_STOP_01 | Test number 6 | STOP and opt-out |
| TEST_REPORT_01 | Test number 7 | Report resend |
| TEST_ADVISOR_01 | Test number 8 | Advisor consent |
| TEST_DUPLICATE_01 | Test number 9 | Duplicate webhook |
| TEST_ROUTING_01 | Test number 10 | Advisor routing |

Create at least:
* 2 active advisors
* 1 inactive advisor
* 1 advisor at maximum workload capacity
* 1 Team Lead
* 1 Operations Manager
* 1 Admin

## 5. Test Case Format

Use this format for every test.

| Field | Meaning |
|-------|---------|
| Test ID | Unique reference number |
| Module | System area being tested |
| Scenario | What is being verified |
| Preconditions | Required setup before testing |
| Steps | Actions taken by tester |
| Expected Result | Required system behavior |
| Actual Result | Tester records actual outcome |
| Status | Pass / Fail / Blocked |
| Severity | Critical / High / Medium / Low |
| Owner | Developer, QA, Operations, or Product |
| Evidence | Screenshot, log ID, report ID, or database record |

## 6. Severity Definitions
| Severity | Meaning | Launch Impact |
|----------|---------|---------------|
| Critical | Privacy, consent, data-loss, security, or major journey failure | Blocks launch |
| High | Core journey failure affecting many leads | Blocks pilot until fixed |
| Medium | Important workflow issue with workaround | Fix before full launch |
| Low | Cosmetic or minor usability issue | Can be scheduled |

## 7. Webhook and Message Ingestion Tests

**QA-WEB-001 — Valid Incoming WhatsApp Webhook**
* **Preconditions**: Evolution API webhook secret configured
* **Steps**: Send FAMILY from TEST_NEW_01
* **Expected Result**: Webhook returns HTTP 200; inbound message is stored; lead is resolved; route is command_start
* **Severity**: Critical
* **Evidence**: HTTP log, conversation_messages record, audit log

**QA-WEB-002 — Invalid Webhook Secret**
* **Preconditions**: Webhook endpoint available
* **Steps**: Send webhook request with incorrect secret
* **Expected Result**: HTTP 401 returned; no lead, session, answer, or message record is created
* **Severity**: Critical
* **Evidence**: HTTP response and database check

**QA-WEB-003 — Missing Webhook Secret**
* **Steps**: Send webhook request without X-CoverScore-Webhook-Secret
* **Expected Result**: HTTP 401 returned; request rejected
* **Severity**: Critical

**QA-WEB-004 — Invalid JSON Payload**
* **Steps**: Send malformed JSON to webhook
* **Expected Result**: HTTP 400 returned; no workflow processing occurs
* **Severity**: High

**QA-WEB-005 — Duplicate WhatsApp Webhook**
* **Preconditions**: Valid inbound message exists
* **Steps**: Replay the same webhook with same Evolution message ID
* **Expected Result**: Only one inbound message record; only one answer saved; only one outbound response sent
* **Severity**: Critical
* **Evidence**: conversation_messages, assessment_answers, outbound-message count

**QA-WEB-006 — Group Message Ignored**
* **Steps**: Send a message from a WhatsApp group
* **Expected Result**: No assessment session starts; no reply is sent
* **Severity**: Medium

**QA-WEB-007 — Unsupported Media Message**
* **Preconditions**: Active assessment session exists
* **Steps**: Send voice note, image without caption, or unsupported file
* **Expected Result**: Session remains unchanged; user receives text-only fallback message
* **Severity**: Medium

## 8. Lead and Session Tests

**QA-SES-001 — New Lead Starts Assessment**
* **Steps**: TEST_NEW_01 sends FAMILY
* **Expected Result**: Lead created; active session created; assessment consent recorded; welcome message sent
* **Severity**: Critical

**QA-SES-002 — Existing Lead Starts New Assessment**
* **Preconditions**: Existing lead has no active session
* **Steps**: Lead sends FAMILY
* **Expected Result**: Existing lead reused; new session created; no duplicate lead record
* **Severity**: High

**QA-SES-003 — One Active Session Rule**
* **Preconditions**: Lead has active Family Protection Score™ session
* **Steps**: Lead sends FAMILY again
* **Expected Result**: Existing session is resumed; second active session is not created
* **Severity**: Critical

**QA-SES-004 — Pause Assessment**
* **Steps**: Start assessment, answer two questions, send PAUSE
* **Expected Result**: Session status becomes paused; current state remains unchanged; pause confirmation sent
* **Severity**: High

**QA-SES-005 — Resume Assessment**
* **Preconditions**: Session is paused
* **Steps**: Send CONTINUE
* **Expected Result**: Session becomes in_progress; current unanswered question is resent; no answer is lost
* **Severity**: High

**QA-SES-006 — Restart Assessment**
* **Preconditions**: Lead has paused or active session
* **Steps**: Send RESTART
* **Expected Result**: System asks for confirmation before discarding progress; no answers are deleted until confirmation
* **Severity**: Medium

**QA-SES-007 — Stop Assessment**
* **Steps**: Start assessment, then send STOP
* **Expected Result**: Session becomes stopped; lead becomes opted out; scheduled reminders are cancelled
* **Severity**: Critical

**QA-SES-008 — Start After STOP**
* **Preconditions**: Lead previously sent STOP
* **Steps**: Send START
* **Expected Result**: System requests clear opt-in confirmation before restarting assessment messages
* **Severity**: Critical

**QA-SES-009 — Completed Session Command Handling**
* **Preconditions**: Lead has completed assessment
* **Steps**: Send CONTINUE
* **Expected Result**: System does not reopen old session; offers REPORT, ADVISOR, or RESTART
* **Severity**: Medium

## 9. WhatsApp Conversation and Validation Tests

**QA-CON-001 — Welcome Message Content**
* **Steps**: Start assessment
* **Expected Result**: Welcome message explains duration, privacy boundary, PAUSE, and STOP commands
* **Severity**: Medium

**QA-CON-002 — Valid Numeric Answer**
* **Preconditions**: Current question accepts options 1–5
* **Steps**: Reply 2
* **Expected Result**: Answer saved; correct risk value saved; next state selected; next question sent
* **Severity**: Critical

**QA-CON-003 — Invalid Text Answer**
* **Preconditions**: Current question accepts numeric options
* **Steps**: Reply hello
* **Expected Result**: No answer saved; invalid reply count increases; current question remains active; fallback sent
* **Severity**: High

**QA-CON-004 — Invalid Number Outside Options**
* **Steps**: Reply 9 where options are 1–4
* **Expected Result**: Same fallback behavior as invalid text
* **Severity**: High

**QA-CON-005 — Repeated Invalid Replies**
* **Steps**: Send three invalid answers in a row
* **Expected Result**: System sends clearer assistance message and offers HELP, PAUSE, and STOP
* **Severity**: Medium

**QA-CON-006 — HELP Command During Assessment**
* **Steps**: Send HELP during a question
* **Expected Result**: Help message sent; current state does not change; assessment can continue
* **Severity**: Medium

**QA-CON-007 — Case Insensitivity**
* **Steps**: Send family, Family, and FAMILY in separate test runs
* **Expected Result**: All are interpreted as start command
* **Severity**: Low

**QA-CON-008 — Whitespace Handling**
* **Steps**: Send 1 
* **Expected Result**: Answer is treated as 1
* **Severity**: Low

**QA-CON-009 — Long Text Protection**
* **Steps**: Send a message longer than 2,000 characters
* **Expected Result**: System does not crash; message is safely logged; user receives fallback guidance
* **Severity**: Medium

## 10. Assessment Branching Tests

**QA-BRN-001 — Dependents Branch**
* **Steps**: Select “No dependents”
* **Expected Result**: Dependent-specific questions are skipped
* **Severity**: High

**QA-BRN-002 — Dependents Present Branch**
* **Steps**: Select “One or more dependents”
* **Expected Result**: Dependent-related questions are shown
* **Severity**: High

**QA-BRN-003 — Education Responsibility Branch**
* **Steps**: Select “Yes” for education responsibility
* **Expected Result**: Education continuity question is shown
* **Severity**: High

**QA-BRN-004 — Education Not Applicable Branch**
* **Steps**: Select “No” for education responsibility
* **Expected Result**: Education question is skipped; category weight is handled correctly
* **Severity**: High

**QA-BRN-005 — Branch Resume Accuracy**
* **Preconditions**: Lead paused after a branching answer
* **Steps**: Send CONTINUE
* **Expected Result**: Correct next unanswered question is resent; no skipped question appears incorrectly
* **Severity**: High

## 11. Database Integrity Tests

**QA-DB-001 — Answer Upsert**
* **Steps**: Submit same question answer twice through controlled replay
* **Expected Result**: One answer row exists; latest valid answer updates same record; no duplicate rows
* **Severity**: High

**QA-DB-002 — Foreign Key Integrity**
* **Steps**: Attempt to create answer with invalid session ID
* **Expected Result**: Database rejects insert; error is logged; no partial record remains
* **Severity**: High

**QA-DB-003 — Session State Integrity**
* **Steps**: Attempt to save answer for a stopped session
* **Expected Result**: Answer is rejected; session remains stopped
* **Severity**: High

**QA-DB-004 — Timestamps in UTC**
* **Steps**: Review created and updated timestamps for lead, session, answer, report, task
* **Expected Result**: All timestamps stored as UTC timestamptz; UI converts to Africa/Lagos
* **Severity**: Medium

**QA-DB-005 — No Duplicate Opportunity**
* **Preconditions**: Opportunity already exists for completed session
* **Steps**: Replay advisor-consent workflow
* **Expected Result**: Only one opportunity exists for the assessment session
* **Severity**: Critical

## 12. Scoring Engine Tests

**QA-SCR-001 — Complete Required Answers Check**
* **Steps**: Attempt scoring with one required answer missing
* **Expected Result**: Scoring does not run; system returns to missing question
* **Severity**: Critical

**QA-SCR-002 — High-Gap Score Calculation**
* **Preconditions**: Use TEST_HIGH_01 with predefined high-risk answers
* **Steps**: Complete assessment
* **Expected Result**: Overall score matches approved expected result; high or urgent priority assigned
* **Severity**: Critical

**QA-SCR-003 — Standard Score Calculation**
* **Preconditions**: Use TEST_STANDARD_01 with balanced answers
* **Steps**: Complete assessment
* **Expected Result**: Overall score matches approved expected result; standard priority assigned
* **Severity**: Critical

**QA-SCR-004 — Score Reproducibility**
* **Steps**: Run same answer set in two separate sessions
* **Expected Result**: Same score, score band, Risk DNA™, priorities, and recommendation result
* **Severity**: Critical

**QA-SCR-005 — Category Weight Redistribution**
* **Preconditions**: Education category is not applicable
* **Steps**: Complete assessment
* **Expected Result**: Weight is redistributed according to approved scoring rules; total applicable weight equals 100%
* **Severity**: High

**QA-SCR-006 — Top Priority Ranking**
* **Steps**: Complete assessment with multiple high-gap categories
* **Expected Result**: Top three priorities are ordered correctly
* **Severity**: High

**QA-SCR-007 — Risk DNA Limit**
* **Steps**: Complete assessment with several severe gaps
* **Expected Result**: Customer-facing report shows no more than two Risk DNA™ labels
* **Severity**: Medium

## 13. Report Generation and Delivery Tests

**QA-RPT-001 — Report Generated After Completion**
* **Steps**: Complete valid assessment
* **Expected Result**: Report record created; status moves from queued to ready; secure URL generated
* **Severity**: Critical

**QA-RPT-002 — Secure Report Link Works**
* **Steps**: Open secure report link in browser
* **Expected Result**: Correct report loads; no login required; report matches session result
* **Severity**: Critical

**QA-RPT-003 — Secure Report Token Is Not Stored Raw**
* **Steps**: Inspect reports table
* **Expected Result**: Only token hash is stored; raw token is not stored in database
* **Severity**: Critical

**QA-RPT-004 — Report Link Expiry**
* **Preconditions**: Use report with expired expires_at
* **Steps**: Open report link
* **Expected Result**: Expired message shown; no report content exposed
* **Severity**: High

**QA-RPT-005 — Report Resend Before Expiry**
* **Steps**: Completed lead sends REPORT
* **Expected Result**: Existing active report link is resent; no duplicate report is generated
* **Severity**: Medium

**QA-RPT-006 — Report Resend After Expiry**
* **Preconditions**: Existing report expired
* **Steps**: Lead sends REPORT
* **Expected Result**: New secure token generated; new report link sent; old token remains invalid
* **Severity**: High

**QA-RPT-007 — Report Delivery Failure Recovery**
* **Steps**: Simulate Evolution API failure while sending report link
* **Expected Result**: Retry sequence runs; successful messages are not duplicated; admin alert sent after final failure
* **Severity**: High

**QA-RPT-008 — Report Viewer Privacy**
* **Steps**: Open report URL and inspect page source and URL
* **Expected Result**: No internal database IDs, phone numbers, raw answers, or sensitive values are exposed unnecessarily
* **Severity**: Critical

## 14. Advisor Consent Tests

**QA-CNS-001 — Advisor Consent Granted**
* **Steps**: Reply 1 to advisor-support prompt, then choose WhatsApp
* **Expected Result**: advisor_contact consent stored as granted; contact preference stored as whatsapp
* **Severity**: Critical

**QA-CNS-002 — Advisor Consent Declined**
* **Steps**: Reply 2
* **Expected Result**: Consent stored as declined; no opportunity created; polite confirmation sent
* **Severity**: Critical

**QA-CNS-003 — Educational Tips Only**
* **Steps**: Reply 3
* **Expected Result**: Educational-follow-up consent stored; no advisor opportunity created; lead is eligible only for approved educational nurture
* **Severity**: High

**QA-CNS-004 — Invalid Consent Reply**
* **Steps**: Reply 4 or text
* **Expected Result**: System requests valid reply; no consent state changed
* **Severity**: High

**QA-CNS-005 — Consent Evidence**
* **Steps**: Grant advisor consent
* **Expected Result**: Consent record includes timestamp, consent text version, and WhatsApp message evidence ID
* **Severity**: Critical

**QA-CNS-006 — Consent Withdrawal**
* **Preconditions**: Advisor consent granted
* **Steps**: Lead sends STOP or approved withdrawal command
* **Expected Result**: Future advisor automation stops; consent record reflects withdrawal where applicable; open opportunity is flagged for review
* **Severity**: Critical

## 15. Opportunity Creation and Routing Tests

**QA-OPP-001 — Opportunity Created Only After Consent**
* **Steps**: Complete assessment but decline advisor support
* **Expected Result**: No opportunity record exists
* **Severity**: Critical

**QA-OPP-002 — Opportunity Created After Consent**
* **Steps**: Grant advisor support and select contact preference
* **Expected Result**: Opportunity created with score, priority, top priorities, consented channel, and first-response due time
* **Severity**: Critical

**QA-OPP-003 — Priority SLA Mapping**
* **Steps**: Create urgent, high, standard, and nurture opportunities
* **Expected Result**: Due times match 1 hour, 2 hours, 24 hours, and selected nurture date rules
* **Severity**: High

**QA-OPP-004 — Advisor Assignment**
* **Preconditions**: Two eligible advisors available
* **Steps**: Create opportunity
* **Expected Result**: Eligible advisor with lowest workload is assigned
* **Severity**: High

**QA-OPP-005 — Inactive Advisor Excluded**
* **Preconditions**: One advisor inactive
* **Steps**: Create opportunity
* **Expected Result**: Inactive advisor is never assigned
* **Severity**: High

**QA-OPP-006 — Capacity Limit Enforced**
* **Preconditions**: One advisor is at maximum active opportunity capacity
* **Steps**: Create opportunity
* **Expected Result**: Advisor at capacity is not assigned
* **Severity**: High

**QA-OPP-007 — No Advisor Available**
* **Preconditions**: No eligible advisors
* **Steps**: Create opportunity
* **Expected Result**: Opportunity enters supervisor queue; admin alert created; lead receives confirmation without false promise of immediate contact
* **Severity**: High

**QA-OPP-008 — First Follow-Up Task Created**
* **Steps**: Create assigned opportunity
* **Expected Result**: One open first-contact task created and assigned to the same advisor
* **Severity**: High

**QA-OPP-009 — Assignment Audit Trail**
* **Steps**: Assign and reassign opportunity
* **Expected Result**: opportunity_assignments history is complete; only one current assignment exists
* **Severity**: High

## 16. Advisor OS Tests

**QA-ADV-001 — Advisor Sees Assigned Opportunities Only**
* **Preconditions**: Two advisors each have assigned opportunities
* **Steps**: Log in as Advisor A
* **Expected Result**: Advisor A sees only Advisor A opportunities
* **Severity**: Critical

**QA-ADV-002 — Team Lead Sees Team Queue**
* **Steps**: Log in as Team Lead
* **Expected Result**: Team Lead sees team opportunities, unassigned queue, and overdue work
* **Severity**: High

**QA-ADV-003 — Opportunity Card Data**
* **Steps**: Open opportunity list
* **Expected Result**: Card shows first name, surname initial, score, priority, top priority, contact preference, next action, and due time
* **Severity**: Medium

**QA-ADV-004 — One Primary Action**
* **Steps**: Open opportunity detail
* **Expected Result**: Only one prominent primary CTA appears in Immediate Next Action card
* **Severity**: Medium

**QA-ADV-005 — Advisor Cannot Edit Score**
* **Steps**: Attempt to edit score, score band, Risk DNA™, or report
* **Expected Result**: No edit controls available; API rejects unauthorized update attempts
* **Severity**: Critical

**QA-ADV-006 — Approved Contact Channel Only**
* **Preconditions**: Lead selected WhatsApp only
* **Steps**: Open opportunity
* **Expected Result**: WhatsApp action shown; phone call action hidden or disabled
* **Severity**: High

**QA-ADV-007 — Stage Transition Rules**
* **Steps**: Attempt invalid stage move, such as Assigned directly to Policy Sold
* **Expected Result**: System blocks transition or requires mandatory sale details and authorized override
* **Severity**: High

**QA-ADV-008 — Policy Sold Requirements**
* **Steps**: Move opportunity to Policy Sold
* **Expected Result**: Policy reference, product category, start date, and renewal date are required
* **Severity**: High

**QA-ADV-009 — Closed Lost Requirements**
* **Steps**: Close opportunity
* **Expected Result**: Closure reason required; open tasks cancelled; audit event written
* **Severity**: High

**QA-ADV-010 — Report Resend Audit**
* **Steps**: Advisor taps Resend Report
* **Expected Result**: Report is sent only to approved number; timeline and audit log updated
* **Severity**: High

## 17. Reminder and Abandonment Tests

**QA-RMD-001 — First Reminder Timing**
* **Preconditions**: Active session inactive for one hour
* **Steps**: Run scheduler
* **Expected Result**: Reminder stage 1 sent once; reminder job recorded
* **Severity**: High

**QA-RMD-002 — Second Reminder Timing**
* **Preconditions**: Lead has received reminder 1 and remains inactive
* **Steps**: Advance test time to 24 hours
* **Expected Result**: Reminder stage 2 sent once
* **Severity**: High

**QA-RMD-003 — Final Reminder Timing**
* **Preconditions**: Lead remains inactive after reminder 2
* **Steps**: Advance test time to 72 hours
* **Expected Result**: Reminder stage 3 sent once
* **Severity**: High

**QA-RMD-004 — No Reminder After STOP**
* **Preconditions**: Lead sent STOP
* **Steps**: Run scheduler repeatedly
* **Expected Result**: No reminder is sent; all reminder jobs remain cancelled
* **Severity**: Critical

**QA-RMD-005 — No Reminder After Completion**
* **Preconditions**: Assessment completed
* **Steps**: Run scheduler
* **Expected Result**: No incomplete-assessment reminder is sent
* **Severity**: High

**QA-RMD-006 — Quiet Hours**
* **Preconditions**: Reminder becomes due at 10:30 PM Africa/Lagos
* **Steps**: Run scheduler
* **Expected Result**: Reminder is deferred to 8:15 AM Africa/Lagos
* **Severity**: High

**QA-RMD-007 — Abandonment Rule**
* **Preconditions**: Reminder stage 3 sent and no activity for seven days
* **Steps**: Run abandonment job
* **Expected Result**: Session status changes to abandoned; audit event created
* **Severity**: Medium

## 18. Delivery Status and Monitoring Tests

**QA-MON-001 — Sent Status Update**
* **Steps**: Receive Evolution API sent delivery event
* **Expected Result**: Matching outbound message updates to sent
* **Severity**: Medium

**QA-MON-002 — Delivered Status Update**
* **Steps**: Receive delivered event
* **Expected Result**: delivered_at timestamp saved
* **Severity**: Medium

**QA-MON-003 — Read Status Update**
* **Steps**: Receive read event
* **Expected Result**: read_at timestamp saved
* **Severity**: Low

**QA-MON-004 — Failed Message Alert**
* **Steps**: Simulate failed outbound message
* **Expected Result**: Retry sequence runs; final failure creates admin alert
* **Severity**: High

**QA-MON-005 — Stuck Processing Session**
* **Preconditions**: Session remains processing for more than 10 minutes
* **Steps**: Run monitor
* **Expected Result**: Retry occurs; unresolved session marked error; admin alert sent
* **Severity**: High

## 19. Security and Privacy Tests

**QA-SEC-001 — Advisor Access Boundary**
* **Steps**: Use Advisor A token to call Advisor B opportunity API endpoint
* **Expected Result**: HTTP 403 or equivalent denial; no data returned
* **Severity**: Critical

**QA-SEC-002 — JWT Expiry**
* **Steps**: Use expired Advisor OS token
* **Expected Result**: Access denied; refresh or re-login required
* **Severity**: High

**QA-SEC-003 — SQL Injection Protection**
* **Steps**: Submit SQL-like text in allowed free-text fields
* **Expected Result**: Input stored safely as text; no query behavior changes; no database error leaks
* **Severity**: Critical

**QA-SEC-004 — Report Token Guess Resistance**
* **Steps**: Attempt random report token URLs
* **Expected Result**: No report data returned; rate limiting applies
* **Severity**: Critical

**QA-SEC-005 — Report Token Revocation**
* **Steps**: Regenerate report link after expiry or resend
* **Expected Result**: Previous token cannot access report
* **Severity**: High

**QA-SEC-006 — Sensitive Data Blocking**
* **Steps**: Send a message containing card-like or identity-like information
* **Expected Result**: System does not request more sensitive information; message is handled safely and flagged for review if configured
* **Severity**: High

**QA-SEC-007 — Secrets Not Exposed**
* **Steps**: Review Node-RED exports, frontend bundle, logs, and error responses
* **Expected Result**: No database password, API key, webhook secret, or raw report token appears in logs or client-side code
* **Severity**: Critical

## 20. Error Recovery Tests

**QA-ERR-001 — PostgreSQL Temporary Outage**
* **Steps**: Simulate database connection failure during answer save
* **Expected Result**: No partial answer state; retry queue runs; admin alert after final failure
* **Severity**: Critical

**QA-ERR-002 — Evolution API Temporary Outage**
* **Steps**: Simulate send-message timeout
* **Expected Result**: Retry at 1, 5, and 15 minutes; no duplicate outbound messages after recovery
* **Severity**: High

**QA-ERR-003 — Report Service Failure**
* **Steps**: Simulate report-service error
* **Expected Result**: Assessment result remains saved; report status becomes failed or queued for retry; lead is not falsely told report is ready
* **Severity**: Critical

**QA-ERR-004 — Invalid Assessment State Configuration**
* **Steps**: Point session to missing state code in staging
* **Expected Result**: System stops safely; no incorrect question sent; admin alert created
* **Severity**: High

**QA-ERR-005 — Advisor Routing Failure**
* **Steps**: Simulate routing query error
* **Expected Result**: Opportunity remains unassigned; supervisor alert created; no false advisor assignment shown
* **Severity**: High

## 21. Performance and Load Tests

**QA-PERF-001 — Concurrent New Leads**
* **Steps**: Simulate 50 new WhatsApp messages within five minutes
* **Expected Result**: All messages acknowledged; no duplicate sessions; response time remains acceptable
* **Severity**: High

**QA-PERF-002 — Concurrent Answer Processing**
* **Steps**: Simulate 100 answer messages across active sessions
* **Expected Result**: Correct answer-to-session matching; no cross-lead data leakage
* **Severity**: Critical

**QA-PERF-003 — Reminder Scheduler Load**
* **Steps**: Seed 1,000 inactive sessions and run reminder scheduler
* **Expected Result**: Scheduler completes without duplicate reminders or blocking message processing
* **Severity**: High

**QA-PERF-004 — Report Generation Queue**
* **Steps**: Complete 25 assessments within 10 minutes
* **Expected Result**: Reports queue and generate correctly; no report is attached to wrong lead
* **Severity**: Critical

## 22. Pilot Acceptance Test

The pilot should begin only after these conditions are met.

| Requirement | Required Result |
|-------------|-----------------|
| All Critical tests | 100% pass |
| High-severity tests | 100% pass or approved workaround documented |
| Consent tests | 100% pass |
| STOP tests | 100% pass |
| Duplicate webhook tests | 100% pass |
| Score reproducibility | 100% pass |
| Report privacy tests | 100% pass |
| Advisor access boundaries | 100% pass |
| Opportunity routing | 100% pass |
| Reminder quiet-hours rule | 100% pass |
| Admin alerts | Confirmed working |
| Database backup | Confirmed |
| Restore test | Confirmed |
| Pilot advisors trained | Confirmed |
| Privacy notice reviewed | Confirmed |

## 23. Pilot Test Script

Use this sequence during the first controlled pilot.

1. Test new lead entry from a social-media CTA.
2. Complete a low-gap assessment.
3. Complete a high-gap assessment.
4. Pause and resume an assessment.
5. Trigger invalid-answer fallback.
6. Trigger STOP and confirm no reminders.
7. Confirm report generation and secure link access.
8. Confirm report resend.
9. Grant advisor consent.
10. Confirm advisor assignment.
11. Confirm first-contact task creation.
12. Confirm advisor access boundary.
13. Move opportunity through Contact Attempted.
14. Book Protection Review.
15. Request quote.
16. Record Policy Sold.
17. Move another lead to Nurture.
18. Close another lead as Closed Lost.
19. Review audit logs.
20. Review admin alerts and delivery-status records.

## 24. QA Sign-Off Template
CoverScore WhatsApp End-to-End QA Test Suite™ v1

Environment:
Build Version:
Date:
QA Lead:
Developer:
Operations Reviewer:
Product Owner:

Critical Tests Passed:
High Tests Passed:
Medium Tests Passed:
Low Tests Passed:

Known Issues:
1.
2.
3.

Approved for:
[ ] Development Testing
[ ] Staging Testing
[ ] Controlled Pilot
[ ] Production Launch

QA Lead Signature:
Product Owner Signature:
Operations Approval:

## 25. Final QA Principle
A successful CoverScore test is not only that a message is sent.

It is that the right lead receives the right message,
at the right stage,
without duplicate processing,
with protected data,
with valid consent,
and with a clear next action for the advisor.

CoverScore Personal™
Reliable journeys. Private insights. Better protection conversations.
