# Testing Strategy

## 1. Test Levels

### 1.1 Unit Tests (Node.js + Mocha/Chai)

Target: Individual functions and modules

**Priority modules to test:**
- Scoring engine (`scoringEngine.js`) — score computation, risk level mapping
- RIE modules (productMapper, opportunityScorer, quoteBuilder, followUpEngine)
- Proposal generator (`generator.js`) — template filling, premium calculation
- Renewal engine (`engine.js`) — each method in isolation
- Analytics queries (`queries.js`) — SQL generation with various parameters
- Prompt rendering (`prompts/index.js`) — variable substitution, multiple renderings

**Example test structure:**
```javascript
describe('Scoring Engine', () => {
  describe('calculateScore()', () => {
    it('should return 100 for all safe answers', () => { ... });
    it('should return 0 for all risky answers', () => { ... });
    it('should exclude null pillar scores', () => { ... });
    it('should correctly compute weighted average', () => { ... });
    it('should map score to correct CSNS tier', () => { ... });
  });
});
```

### 1.2 Integration Tests

Target: API endpoints interacting with database

**Key test scenarios:**
- POST /api/webhook/evolution — full assessment flow
- POST /api/proposals/generate-pdf — PDF generation from lead data
- POST /api/auth/login — authentication flow
- GET /api/analytics/overview — data aggregation
- POST /api/renewals/:id/decision — state transitions

**Test database:** Separate SQLite file (`test.db`) with seeded test data

### 1.3 End-to-End Tests

Target: Full user journeys

**Journey 1: Complete Assessment**
1. User sends START SME ASSESSMENT via WhatsApp
2. Answers all questions
3. Receives full report (4-5 messages)
4. Requests advisor
5. Lead appears in admin dashboard

**Journey 2: Advisor Conversion**
1. Login as advisor
2. View pipeline
3. Open copilot brief
4. Generate PDF proposal
5. Send to client
6. Client accepts → policy issued

**Journey 3: Renewal**
1. Create policy with expiry in 90 days
2. Run renewal scheduler
3. Verify renewal record created
4. Send reminder
5. Approve renewal
6. Verify new policy created

## 2. Test Data

### Seed Data Requirements

- 3 users (admin, sales, analyst)
- 10 leads with various statuses and scores
- 5 completed assessments with full answer sets
- 2 issued policies with future expiries
- 3 proposals (Draft, Sent, Accepted)
- Sample activities and tasks

### Test Answers (by prefix)

Pre-built answer sets for each industry prefix stored as JSON fixtures:
```
test/fixtures/answers-sme.json
test/fixtures/answers-hos.json
test/fixtures/answers-mfg.json
...
```

## 3. Testing Tools

| Tool | Purpose |
|------|---------|
| Mocha | Test runner |
| Chai | Assertion library |
| Sinon | Mocking/stubbing |
| Supertest | HTTP integration tests |
| Istanbul/NYC | Code coverage |

## 4. Coverage Targets

| Module | Target Coverage |
|--------|-----------------|
| Scoring engine | 95% |
| RIE | 90% |
| Proposal generator | 85% |
| Renewal engine | 85% |
| Analytics queries | 80% |
| Auth | 90% |
| Webhook | 70% (harder to test async) |

## 5. Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx mocha test/scoring.test.js

# Watch mode (development)
npx mocha --watch test/
```

## 6. Continuous Integration (Planned)

- GitHub Actions on push to main
- Run unit + integration tests
- Run lint (ESLint)
- Check coverage threshold
- Build and deploy if all checks pass

## 7. Manual QA Checklist

### Pre-Deploy
- [ ] All tests pass
- [ ] No console errors
- [ ] WhatsApp webhook processes correctly
- [ ] Scoring matches expected values
- [ ] RIE output contains all layers
- [ ] PDF proposal generates without errors
- [ ] Renewal scheduler runs without crashing

### Post-Deploy
- [ ] Landing pages load for each industry
- [ ] WhatsApp assessment flow completes
- [ ] Report messages arrive in correct order
- [ ] Advisor dashboard shows correct data
- [ ] Analytics numbers are reasonable
- [ ] Email reports are sent
- [ ] Renewal records created for expiring policies
