# Security Specification

## 1. Authentication

### 1.1 JWT Token

All web API routes (except public) require JWT Bearer authentication.

**Token structure:**
```json
{
  "sub": 1,
  "email": "admin@coverscore.ai",
  "role": "admin",
  "iat": 1720800000,
  "exp": 1720886400
}
```

**Configuration:**
- Algorithm: HS256
- Secret: `JWT_SECRET` environment variable
- Expiry: 24 hours
- Refresh tokens: 30 days (stored in `refresh_tokens` table)

### 1.2 Password Management

- Passwords hashed with bcrypt (12 salt rounds)
- Minimum password length: 8 characters
- No password storage in plaintext anywhere
- Password reset flow via email token (not yet implemented)

## 2. Authorization (RBAC)

### 2.1 Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full system access — CRUD all entities, manage users, view all data |
| `sales` | CRUD own leads, view own analytics, generate proposals, manage own pipeline |
| `analyst` | Read-only analytics + reports |
| `user` | View own assessment, request advisor |

### 2.2 Middleware

```javascript
// Require authenticated user
router.get('/admin/dashboard', authenticate, (req, res) => { ... });

// Require specific role
router.get('/api/analytics/overview', authenticate, requireAgent, (req, res) => { ... });
```

### 2.3 Route Protection

All sensitive routes use the `authenticate` middleware to verify JWT before processing. Role checks use `requireAgent` (admin/sales) or inline role checks.

## 3. API Security

### 3.1 Rate Limiting

- All `/api/*` routes: 100 requests per minute per IP
- Applied via `express-rate-limit` middleware
- Returns 429 with `{ error: "Too Many Requests" }` when exceeded

### 3.2 Headers

Helmet.js applies security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (admin routes) / `SAMEORIGIN` (public)
- `X-XSS-Protection: 0`
- `Strict-Transport-Security: max-age=15552000`
- `Content-Security-Policy` (disabled for inline styles)

### 3.3 Input Validation

- All request bodies parsed via `express.json()`
- SQL injection prevented by parameterized queries (no string concatenation)
- JSON parsing wrapped in try/catch for malformed payloads
- WhatsApp messages validated for structure before processing

## 4. Data Protection

### 4.1 Sensitive Data

- Passwords: bcrypt hashed, never logged
- Phone numbers: stored in plaintext (required for WhatsApp)
- Email addresses: stored in plaintext
- Assessment answers: stored as JSON in database
- JWT secrets: environment variable only
- API keys: environment variables only

### 4.2 Database

- SQLite (dev): file permissions restrict to application user
- PostgreSQL (prod): connection string in environment variable only
- No SQL dumps in source control
- Migration scripts are idempotent

### 4.3 Logging

- No sensitive data logged (passwords, tokens, API keys)
- Phone numbers logged for debugging with user consent
- Error stacks logged but stripped of sensitive context

## 5. WhatsApp Security

### 5.1 Evolution API

- Self-hosted on controlled infrastructure
- API key in environment variable
- Webhook URL authenticated by API key
- Message decryption handled by Evolution API

### 5.2 Webhook Validation

- Only processes events from configured Evolution instance
- Ignores messages where `fromMe: true` (avoid loops)
- Validates payload structure before processing

## 6. Environment Variable Management

```
# Required
APP_URL=https://coverscore.site
JWT_SECRET=<64-char-random-string>
WHATSAPP_BOT_NUMBER=2349165304629
EVOLUTION_API_URL=https://evolution.cover.zone
EVOLUTION_API_KEY=<uuid>

# Email (optional — falls back gracefully)
SMTP_SERVICE=gmail
SMTP_USER=olaakanbi77@gmail.com
SMTP_PASS=<app-password>

# Database (optional — defaults to SQLite)
DATABASE_URL=postgres://user:pass@host:5432/coverscore
DB_PATH=./data/coverscore.db

# AI (optional — used for enhanced report generation)
OPENAI_API_KEY=<key>

# Admin defaults
ADMIN_EMAIL=admin@coverscore.ai
ADMIN_PASSWORD=<hashed>
ADMIN_PHONE=2348123456789

# PM2
PM2_UPDATE_ENV=true
```

## 7. Deployment Security

- PM2 managed with `--update-env` for environment variable refresh
- Nginx reverse proxy with SSL termination (Let's Encrypt)
- Automatic HTTP → HTTPS redirect
- DDoS protection via Cloudflare (planned)
- Regular security updates (npm audit)
