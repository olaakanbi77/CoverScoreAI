# State Machine Documentation

## 1. Assessment States

```
                    ┌─────────────┐
                    │   Draft     │
                    └──────┬──────┘
                           │ User sends START
                           ▼
                    ┌─────────────┐
                    │   Started   │
                    └──────┬──────┘
                           │ Question 1 answered
                           ▼
                    ┌─────────────┐
                    │ In Progress │ ◄──── Each answer transitions
                    └──────┬──────┘       to next question
                           │
                           │ All questions answered
                           ▼
                    ┌─────────────┐
                    │  Completed  │
                    └──────┬──────┘
                           │ Score calculated
                           ▼
                    ┌─────────────┐
                    │  Scored     │
                    └──────┬──────┘
                           │ AI report generated
                           ▼
                    ┌─────────────┐
                    │  Reported   │
                    └──────┬──────┘
                           │ Report delivered
                           ▼
                    ┌─────────────┐
                    │  Delivered  │
                    └─────────────┘
```

## 2. Lead States

```
                    ┌──────────────────┐
                    │   New Lead        │
                    └────────┬─────────┘
                             │ Assessment started
                             ▼
                    ┌──────────────────┐
                    │ WhatsApp Engaged │
                    └────────┬─────────┘
                             │ Assessment completed
                             ▼
                    ┌──────────────────┐
                    │   Report Sent     │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │  Qualified    │  │  Nurture      │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
                   │ Follow-up       │ Auto-nurture
                   ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │ Proposal Sent │  │  Nurturing    │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
            ┌──────┴──────┐          │
            │             │          │
            ▼             ▼          │
    ┌────────────┐ ┌──────────┐      │
    │  Accepted   │ │ Declined │      │
    └──────┬─────┘ └────┬─────┘      │
           │            │            │
           ▼            │            │
    ┌────────────┐      │            │
    │    Won     │◄─────┴─────┬──────┘
    └──────┬─────┘            │
           │                  │
           ▼                  ▼
    ┌────────────┐  ┌──────────────┐
    │   Active   │  │    Lost      │
    │   Client   │  └──────────────┘
    └────────────┘
```

**State transition rules:**
- `New Lead` → `WhatsApp Engaged`: When first question is answered
- `WhatsApp Engaged` → `Report Sent`: When assessment completes
- `Report Sent` → `Qualified`: If advisor requested OR AI qualifier says qualified
- `Report Sent` → `Nurture`: If no advisor request AND AI says nurture
- `Qualified` → `Proposal Sent`: When proposal/quote delivered
- `Proposal Sent` → `Accepted` / `Declined`: Client response
- `Accepted` → `Won`: Policy issued
- `Won` → `Active Client`: Policy in force
- `Declined` / `Lost` → Terminal states (can be revived with new assessment)

## 3. Proposal States

```
                    ┌─────────────┐
                    │    Draft     │
                    └──────┬──────┘
                           │ Sent to client
                           ▼
                    ┌─────────────┐
                    │    Sent     │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
            ┌────────────┐ ┌────────────┐
            │  Accepted   │ │  Declined  │
            └──────┬─────┘ └────────────┘
                   │
                   ▼
            ┌────────────┐
            │ Converted   │
            └────────────┘
```

**Rules:**
- `Draft` → Advisor creates initial proposal
- `Sent` → Proposal transmitted to client
- `Accepted` → Client agrees via link
- `Declined` → Client rejects via link
- `Converted` → Policy issued from accepted proposal

## 4. Task States

```
                    ┌──────────────┐
                    │   Pending    │
                    └──────┬───────┘
                           │ Advisor completes
                           ▼
                    ┌──────────────┐
                    │  Completed   │
                    └──────────────┘
                    ┌──────────────┐
                    │  Cancelled   │
                    └──────────────┘
```

**Auto-transitions:**
- `Pending` → Overdue (if due_date passed and status still pending)
- `Pending` → `Completed` (advisor marks done)
- `Pending` → `Cancelled` (lead moved to different stage)

## 5. Policy States

```
                    ┌──────────────┐
                    │    Active    │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │              │
                    ▼              ▼
            ┌────────────┐ ┌────────────┐
            │   Expired   │ │ Cancelled  │
            └──────┬─────┘ └────────────┘
                   │
                   ▼
            ┌────────────┐
            │  Renewed    │
            └────────────┘
```

**Rules:**
- `Active` → Policy in force
- `Active` → `Expired`: When expiry_date passes
- `Active` → `Cancelled`: Policy terminated early (non-payment, request)
- `Expired` → `Renewed`: New policy issued through renewal process

## 6. Renewal States

```
                    ┌──────────────┐
                    │   Pending    │  ← Created 90 days before expiry
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │              │
                    ▼              ▼
            ┌────────────┐ ┌──────────────┐
            │Reassessing  │ │Proposal Gen. │
            └──────┬─────┘ └──────┬───────┘
                   │              │
                   └──────┬───────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Decision   │
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  │              │
                  ▼              ▼
          ┌────────────┐ ┌────────────┐
          │  Approved   │ │  Declined  │
          └────────────┘ └────────────┘
```

**Timing rules:**
- `Pending` created at T-90 days (90 days before expiry)
- `Pending` → `Reassessing`: If advisor triggers new assessment
- `Pending` → `Proposal Generated`: Auto-generate renewal proposal
- Reminder sent at T-30 days
- Escalated to advisor at T-7 days if still pending

## 7. WhatsApp Conversation States

```
                    ┌──────────────┐
                    │   initial    │
                    └──────┬───────┘
                           │ START trigger
                           ▼
                    ┌──────────────┐
                    │ {prefix}_001 │ ← First question
                    └──────┬───────┘
                           │ Answer received
                           ▼
                    ┌──────────────┐
                    │ {prefix}_002 │ ← Next question
                    └──────┬───────┘
                           │ ...
                           ▼
                    ┌──────────────┐
                    │ {prefix}_00N │ ← Last question
                    └──────┬───────┘
                           │ Assessment complete
                           ▼
                    ┌──────────────────┐
                    │ awaiting_consul- │ ← Final state
                    │     tation       │
                    └──────────────────┘
```

**Resume rules:**
- If user reconnects at `{prefix}_005`, conversation resumes at same state
- If user types RESTART, state resets to `{prefix}_001` with cleared data
- If user does nothing for 24h, reminder message triggers from current state

## 8. Opportunity States (RIE)

```
                    ┌────────────────┐
                    │  Unassigned    │ ← RIE creates after scoring
                    └──────┬─────────┘
                           │ Advisor assigned
                           ▼
                    ┌────────────────┐
                    │   Assigned     │
                    └──────┬─────────┘
                           │
                    ┌──────┴─────────┐
                    │                │
                    ▼                ▼
            ┌──────────────┐ ┌──────────────┐
            │  Contacted    │ │  In Progress │
            └──────┬───────┘ └──────┬───────┘
                   │                │
                   └──────┬─────────┘
                          │
                          ▼
                    ┌────────────────┐
                    │    Closed      │
                    │  (Won / Lost)  │
                    └────────────────┘
```
