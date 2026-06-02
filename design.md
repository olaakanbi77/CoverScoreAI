# CoverScore AI - Design Document

## 1. Project Overview

**Project Name:** CoverScore AI
**Type:** Insurance Risk Intelligence Platform (Web Application)

**Core Functionality:** A SaaS-ready web platform that enables users to complete multi-step risk assessments, receive AI-powered risk analysis and insurance recommendations, while providing administrators and agents a dashboard to manage leads and track conversions.

**Target Users:**
- Business owners seeking insurance coverage
- Insurance sales agents managing leads
- Analysts reviewing risk data
- System administrators

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v20+ LTS |
| Framework | Express.js |
| Language | JavaScript |
| Frontend | Handlebars (.hbs) |
| Database | SQLite3 (sqlite3 driver) |
| Authentication | JWT (Access + Refresh tokens), BCrypt |
| Email | Nodemailer with SMTP |
| AI | Mistral AI API |
| Containerization | Docker & Docker Compose |

### 2.2 Database Configuration

- **WAL Mode:** Enabled for concurrent reads
- **Foreign Keys:** Enabled
- **Single Connection Module:** All DB access via centralized module
- **Transactions:** Used for multi-step writes

### 2.3 Project Structure

```
CoverScore AI/
├── src/
│   ├── config/
│   │   └── database.js          # SQLite connection & initialization
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access control
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── auth.js              # Auth routes (login, register, reset)
│   │   ├── assessment.js        # Risk assessment routes
│   │   ├── leads.js             # Lead management routes
│   │   ├── admin.js             # Admin dashboard routes
│   │   └── analytics.js         # Analytics routes
│   ├── services/
│   │   ├── scoringEngine.js     # Weighted risk scoring
│   │   ├── aiService.js         # Mistral AI integration
│   │   ├── emailService.js      # Nodemailer email sending
│   │   └── industryIntelligence.js # Industry-to-risk mapping
│   ├── models/
│   │   └── index.js             # Database models
│   ├── views/
│   │   ├── layouts/
│   │   ├── partials/
│   │   ├── auth/
│   │   ├── assessment/
│   │   ├── dashboard/
│   │   └── admin/
│   ├── public/
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── app.js                    # Express app setup
├── .env                          # Environment variables
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 3. Database Schema

### 3.1 Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| email | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| name | TEXT | NOT NULL |
| phone | TEXT | |
| business_name | TEXT | |
| industry | TEXT | |
| role | TEXT | DEFAULT 'user' (admin/sales/analyst/user) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | |

#### assessments
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | FOREIGN KEY → users |
| answers | JSON | NOT NULL |
| score | INTEGER | NOT NULL |
| risk_level | TEXT | (low/moderate/high/critical) |
| ai_report | TEXT | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### leads
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| phone | TEXT | |
| business_name | TEXT | |
| assessment_id | INTEGER | FOREIGN KEY → assessments |
| score | INTEGER | |
| risk_level | TEXT | |
| status | TEXT | DEFAULT 'new' (new/contacted/converted) |
| notes | TEXT | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | |

---

## 4. API Endpoints

### 4.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Invalidate token |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/password-reset | Request password reset |

### 4.2 Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assessment/start | Start new assessment |
| POST | /api/assessment/section | Save section progress |
| POST | /api/assessment/submit | Submit & calculate score |
| GET | /api/assessment/:id | Get assessment result |

### 4.3 Leads (Admin/Agent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/leads | List all leads (paginated) |
| GET | /api/leads/:id | Get lead details |
| PUT | /api/leads/:id/status | Update lead status |
| PUT | /api/leads/:id/notes | Add notes to lead |
| DELETE | /api/leads/:id | Delete lead |

### 4.4 Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List users |
| PUT | /api/admin/users/:id/role | Update user role |
| GET | /api/admin/dashboard | Dashboard stats |

### 4.5 Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/overview | Overall metrics |
| GET | /api/analytics/risk-distribution | Risk level breakdown |
| GET | /api/analytics/conversion | Conversion metrics |

---

## 5. Risk Scoring Engine

### 5.1 Weighted Scoring Rules

| Factor | Risk Added |
|--------|------------|
| High risk answer | +5 |
| Medium risk answer | +3 |
| Low risk answer | +1 |
| No insurance | +5 |
| Customer visits premises | +5 |
| No fire protection | +5 |
| High asset value | +5 |
| No staff cover | +4 |

### 5.2 Risk Levels

| Score Range | Level | Color |
|-------------|-------|-------|
| 0-25 | Low | Green |
| 26-50 | Moderate | Yellow |
| 51-75 | High | Orange |
| 76+ | Critical | Red |

---

## 6. Industry Risk Intelligence

| Industry | Primary Risks |
|----------|---------------|
| Retail | Fire, Theft, Liability |
| Construction | Injury, Equipment, Liability |
| Technology | Cyber, Professional Liability |
| Healthcare | Malpractice |
| Manufacturing | Equipment, Liability, Fire |
| Hospitality | Liability, Fire |

---

## 7. AI Integration

### 7.1 Mistral AI Report Generation

Each assessment submission triggers a Mistral AI API call to generate:
- Executive summary
- Top 3 risks
- Financial impact assessment
- Insurance product recommendations
- Urgency level indicator

### 7.2 Prompt Structure

```javascript
{
  model: "mistral-large-latest",
  messages: [
    { role: "system", content: "You are an insurance risk analyst..." },
    { role: "user", content: "Generate a risk report for: {assessment_data}" }
  ],
  response_format: { type: "json_object" }
}
```

---

## 8. UI/UX Design

### 8.1 Design Principles
- Premium, modern interface
- Mobile-first responsive design
- Smooth transitions and animations
- Card-based layout (no HTML tables)
- Progress indicator for multi-step assessment

### 8.2 Color Palette

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | #F8FAFC | #0F172A |
| Surface | #FFFFFF | #1E293B |
| Primary | #3B82F6 | #60A5FA |
| Success | #22C55E | #4ADE80 |
| Warning | #F59E0B | #FBBF24 |
| Danger | #EF4444 | #F87171 |
| Text Primary | #1E293B | #F1F5F9 |
| Text Secondary | #64748B | #94A3B8 |

### 8.3 Risk Level Colors
- **Low (0-25):** Green (#22C55E)
- **Moderate (26-50):** Yellow (#F59E0B)
- **High (51-75):** Orange (#F97316)
- **Critical (76+):** Red (#EF4444)

### 8.4 Typography
- **Headings:** Inter / system-ui
- **Body:** Inter / system-ui
- **Monospace:** JetBrains Mono (for scores/codes)

### 8.5 Key Components
- Navigation bar with user menu
- Dashboard cards with metrics
- Multi-step assessment wizard with progress bar
- Lead table with filters and search
- Risk gauge visualization
- Report preview cards

---

## 9. Security Requirements

- All secrets in `.env` file (never committed)
- JWT access tokens with expiration
- BCrypt password hashing (cost factor 12)
- All endpoints secured (except auth routes)
- Input validation on all routes
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding in Handlebars)
- Errors logged to file, generic messages to users
- RBAC enforcement on protected routes

---

## 10. Email System

### 10.1 Triggers
- Assessment completed → Send report to user
- Password reset request

### 10.2 Email Template Content
- Risk score badge
- Summary section
- Top 3 risks
- CTA buttons (Request Quote, Book Consultation)
- Dashboard link

---

## 11. Application Startup

### 11.1 Initialization Sequence
1. Load environment variables from `.env`
2. Initialize SQLite database connection
3. Create tables (IF NOT EXISTS)
4. Create default admin user (from .env)
5. Start Express server on port 3016

---

## 12. Deployment

### 12.1 Docker Configuration
- Multi-stage Dockerfile
- docker-compose.yml with:
  - Node.js app service
  - Volume for SQLite database persistence

### 12.2 Environment Variables (.env)
```
PORT=3016
DB_PATH=./data/coverscore.db
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<refresh_secret>
MISTRAL_API_KEY=<key>
MISTRAL_MODEL=<model>
SMTP_HOST=<host>
SMTP_PORT=<port>
SMTP_USER=<user>
SMTP_PASS=<pass>
ADMIN_EMAIL=<admin@email.com>
ADMIN_PASSWORD=<admin_password>
```

---

## 13. Assessment Flow

```
1. User lands on homepage
2. Clicks "Start Assessment"
3. Registers/Logs in
4. Completes 5-step wizard:
   ├── Step 1: Business Info
   ├── Step 2: Assets
   ├── Step 3: Liability
   ├── Step 4: Staff
   └── Step 5: Insurance
5. System calculates risk score
6. AI generates full report
7. Email sent with report link
8. User redirected to result page
9. Lead created in system (status: new)
10. Agent reviews and follows up
```

---

## 14. Lead Pipeline

```
New → Contacted → Converted
         ↓
     Lost (optional status)
```

### 14.1 Priority Colors
- Critical: Red (#EF4444)
- High: Orange (#F97316)
- Moderate: Yellow (#F59E0B)
