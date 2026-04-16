# Project Details:

## Project Name: CoverScore AI

I want to build a web app.

The web app is an **Insurance Risk Intelligence Platform** that helps individuals and businesses assess their risk exposure and receive AI-powered insurance recommendations.

It should have a user interface that is clean, modern, and mobile-first. It should also have a backend that is secure, scalable, and reliable.

---

# Core System Foundation (Authentication & Tenant Setup)

This stage makes the system usable and scalable (SaaS-ready).

## 1. User Authentication

• User registration
• Login / logout
• Password reset
• Secure authentication (JWT or session-based)

---

## 2. User Profile Setup

• Name
• Email
• Phone number
• Business name (optional)
• Industry

---

## 3. Role-Based Access Control (RBAC)

Roles:
• Admin
• Sales Agent
• Analyst

Features:
• Assign roles
• Restrict access to modules

---

## 4. Lead & Client Management

Admin/Agents can:
• View all assessment submissions
• Track leads
• Update lead status:

* New
* Contacted
* Converted
  • Add notes to each lead

---

## 5. Dashboard (Core)

Show quick insights:
• Total assessments
• High-risk leads
• Conversion rate
• Recent submissions
• Quick action buttons

---

# Risk Assessment System (CORE PRODUCT)

## 1. Assessment Engine (Multi-Step)

Sections:

### Business Info

• Industry
• Number of employees
• Revenue range
• Location type

### Assets

• Equipment ownership
• Asset value
• Fire protection
• Loss history

### Liability

• Customer interaction
• Professional services
• Risk of client loss

### Staff

• Employees
• Risk exposure
• Staff benefits

### Insurance

• Existing insurance
• Type
• Last review

---

## 2. Scoring Engine

Implement weighted scoring:

• High risk = +5
• Medium risk = +3
• Low risk = +1

Rules:
• No insurance → +5
• Customers visit → +5
• No fire protection → +5
• High asset value → +5
• No staff cover → +4

Risk Levels:
• 0–25 → Low
• 26–50 → Moderate
• 51–75 → High
• 76+ → Critical

---

## 3. Industry Intelligence Layer

Map industries to risks:

• Retail → Fire, Theft, Liability
• Construction → Injury, Equipment, Liability
• Tech → Cyber, Professional Liability
• Healthcare → Malpractice

System should:
• Adjust insights based on industry
• Customize recommendations

---

## 4. AI Risk Analysis Engine

Use OpenAI API.

Generate:

• Executive summary
• Top 3 risks
• Financial impact
• Insurance recommendations
• Urgency level

---

## 5. Report System

Each assessment generates:

• Risk score
• Risk level (color-coded)
• AI-generated insights
• Key exposures
• Recommended insurance products

---

# Lead Capture & Conversion System

## 1. Lead Capture

Fields:
• Name
• Email
• Phone
• Business name

Store:
• Answers (JSON)
• Score
• Risk level
• AI report

---

## 2. Email System

Send report via email:

Includes:
• Risk score
• Summary
• Top risks
• Link to dashboard

---

## 3. Conversion Tools

• “Request Quote” button
• “Book Consultation”
• Estimated insurance cost range

---

# Admin Dashboard System

## 1. Lead Management Table

Display:
• Name
• Email
• Score
• Risk level
• Industry
• Date

---

## 2. Filters

• Risk level
• Industry
• Status

---

## 3. Lead Actions

• View full report
• Add notes
• Change status

---

## 4. Priority System

• Critical → Red
• High → Orange
• Moderate → Yellow

---

# Analytics & Insights

## 1. Reports

• Total assessments
• Risk distribution
• Conversion metrics

---

## 2. Visual Dashboard

Charts for:
• Risk trends
• Industry distribution
• Lead conversion

---

# Technical Architecture

## Runtime:

• Node.js (v20+ LTS)

## Framework:

• Express.js

## Language:

• JavaScript

## Frontend:

• Handlebars (.hbs)

## Database:

• SQLite3 (sqlite + sqlite3 driver)

* WAL mode enabled
* Foreign Keys enabled

## Authentication:

• JWT (Access & Refresh tokens)
• BCrypt for password hashing

## Email:

• Nodemailer with SMTP (.env)

## AI:

• OpenAI API integration

## Containerization:

• Docker & Docker Compose

---

# System Constraints

• Use .env for secrets
• Single DB connection module
• Enable WAL + Foreign Keys
• Use transactions for multi-step writes
• Fully responsive UI
• Avoid HTML tables (use div-based grids)
• Paginate all lists
• Include search functionality

---

# Error Handling

• Do not expose server errors
• Log errors to file
• Show generic user messages
• Secure all endpoints

---

# UI/UX Requirements

• Premium, modern interface
• Mobile-first design
• Smooth transitions
• Light/Dark mode support
• Card-based layout
• Progress bar for assessment

---

# App Behavior Rules

• On app start:

* Create DB tables IF NOT EXISTS

• Default Admin:

* Set admin user from .env

• Port:

* Use Port 3016

---

# Developer Workflow

• Create project.md
• Continuously update progress
• Write clean, modular code
• Comment key logic

---

# Bonus Features (If Possible)

• PDF report generation
• Admin authentication system
• Basic analytics tracking
• Export leads (CSV)

---

# Final Goal

Build a **scalable Insurance Risk Intelligence Platform** that:

• Generates leads
• Builds trust
• Converts users into insurance clients
• Can evolve into a full insurtech SaaS product
