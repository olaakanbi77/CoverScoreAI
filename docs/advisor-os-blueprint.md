# CoverScore Advisor OS™ — Personal Opportunities Specification v1
Product Specification for the Advisor Workspace

Product: CoverScore Advisor OS™
Module: Personal Opportunities
Primary assessment: Family Protection Score™
Primary users: CoverScore Risk Advisors, Team Leads, Operations Managers, Administrators
Platform priority: Mobile-first responsive web app
Core principle: One screen, one goal.

## 1. Purpose
The Personal Opportunities module helps advisors act on leads who have:
- completed a CoverScore Personal™ assessment,
- received their Family Protection Report™, and
- explicitly requested advisor support.

It is not an assessment tool.
It is not a report-generation tool.
It is not a general CRM full of unqualified contacts.

It is an action workspace for consented, insight-led opportunities.

## 2. Product Promise
The advisor should open CoverScore Advisor OS™ and immediately know:
- Who needs attention now
- Why the opportunity matters
- What the lead asked for
- What action to take next
- What should happen after that action

## 3. Scope for Version 1
### Included
- Personal opportunity list
- Priority-based opportunity queue
- Opportunity detail
- Lead summary
- Family Protection Score™ summary
- Protection Profile™ / Risk DNA™
- Top three priorities
- Report access
- Contact preference
- Advisor action shortcuts
- Pipeline stage management
- Follow-up tasks
- Notes
- Activity timeline
- Advisor assignment
- Supervisor queue
- Basic performance dashboard
- Consent enforcement
- Audit logging

### Excluded from Version 1
Full policy administration, Premium collection, Claims management, Underwriting workflow, Complex commission management, Full WhatsApp inbox replacement, Automated quotation engine, Multi-insurer comparison engine.

## 4. User Roles
- **Risk Advisor**: Work assigned opportunities and update progress
- **Team Lead**: Monitor advisor queues and reassign opportunities
- **Operations Manager**: Monitor pipeline, response time, and conversion
- **Admin**: Configure users, routing, permissions, and rules
- **Super Admin**: Full system control and audit access
- **Viewer**: Read-only reporting access

## 5. Core Opportunity Workflow
New -> Assigned -> Contact Attempted -> Conversation Started -> Protection Review Booked -> Quote Requested -> Quote Sent -> Policy Sold
Alternative paths: Nurture, Closed Lost.

## 6. Opportunity Stages
| Stage | Meaning | Advisor Action Required |
| --- | --- | --- |
| New | Opportunity created but not yet assigned | System or supervisor assigns |
| Assigned | Advisor owns the opportunity | Make first contact |
| Contact Attempted | Advisor attempted approved contact | Record outcome or schedule next task |
| Conversation Started | Lead has responded | Understand need and guide next step |
| Protection Review Booked | Advisor and lead agreed on review time | Attend or conduct review |
| Quote Requested | Lead requested suitable protection options | Prepare quote request |
| Quote Sent | Quote or proposal sent | Follow up on decision |
| Policy Sold | Policy completed | Record policy reference |
| Nurture | Lead is interested but not ready | Follow scheduled nurture sequence |
| Closed Lost | Opportunity is no longer active | Record reason |

## 7. Opportunity Priority Rules
- **Urgent**: Very high protection gap plus explicit advisor request (1 hour)
- **High**: Significant protection gap plus advisor request (2 hours)
- **Standard**: Moderate protection gap plus advisor request (24 hours)
- **Nurture**: Lead wants education or later follow-up (No immediate SLA)

## 8. Advisor OS Navigation
Bottom Navigation for Mobile: Home | Opportunities | Tasks | Profile
Desktop Left Navigation: Dashboard, Opportunities, Tasks, Reports, Team Queue, Settings

## 9. Screen 1 — My Opportunities
Help the advisor identify and open the next best opportunity.
- Summary Strip: [ 3 Due Today ] [ 5 High Priority ] [ 12 Active ]
- Filter Chips: All | New | Due Today | High Priority | Waiting for Me | Nurture
- Sort Order: Overdue -> Urgent -> High-priority -> Due-today -> New -> Standard -> Nurture

## 10. Screen 2 — Opportunity Detail
Help the advisor understand the opportunity and take one appropriate next action.
Layout Order:
1. Lead Summary
2. Immediate Next Action
3. Score and Protection Profile
4. Priority Areas
5. Report Access
6. Contact Preference
7. Pipeline Progress
8. Activity Timeline
9. Notes

## 11. Screen 3 — Update Opportunity Stage
Help the advisor record the next meaningful change without unnecessary form fields.
Actions: Book Protection Review, Request Quote, Move to Nurture, Close Opportunity.

## 12. Screen 4 — Tasks
Help the advisor complete time-sensitive work.
Sections: Overdue, Due Today, Upcoming, Completed.

## 13. Screen 5 — Team Queue
Help supervisors ensure no consented lead is ignored.

## 14. Advisor Action Rules
- Message on WhatsApp
- Call Lead
- Book Protection Review
- Add Note
- Resend Report

## 15. Advisor Conversation Guidance
Suggested opening phrases based on priorities (Income Continuity, Family Life Protection, etc.)

## 16. Follow-Up Automation Rules
SLA rules, No Response rules, Advisor Reminder rules.

## 17. Opportunity Detail Activity Timeline
Track all events related to the opportunity.

## 18. Performance Dashboard
Metrics for advisors and team leads.

## 19. Mobile UX Rules
One main action per screen. Expandable cards. Avoid dense tables.

## 20. Desktop UX Rules
Two-column layout for opportunity details.

## 21. Data Required from the Backend
Opportunity List Payload, Opportunity Detail Payload (JSON structures provided in spec).

## 22. Permission Rules
Matrix of actions by role.

## 23. Audit Requirements
Log all major opportunity events.

## 24. MVP Acceptance Criteria
Advisors see only their leads, priorities correct, clear next action, controlled transitions, tasks auto-created, privacy maintained.

## 25. Final Product Principle
CoverScore Advisor OS™ should not turn advisors into data-entry clerks. It should turn assessment insight into a clear, respectful, and timely conversation.
