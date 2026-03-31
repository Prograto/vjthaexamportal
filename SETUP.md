# ExamMaster Pro — Setup Guide

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# Edit .env — set your MONGODB_URI
npm run seed      # Creates admin user
npm run dev       # Starts on http://localhost:5000
```

### 2. Frontend
```bash
# In project root
npm install
npm run dev       # Starts on http://localhost:5173 (or 8080)
```

## Login Credentials

After running `npm run seed`:

| Role    | Email                      | Password     |
|---------|----------------------------|--------------|
| Admin   | admin@exammaster.com       | admin123456  |

Create college and student accounts from the Admin → User Management page.

## What's Fixed

| Problem                          | Fix |
|----------------------------------|-----|
| Login not redirecting            | `login()` is async — now properly `await`ed |
| Page redirects back to login     | Auth loading state checked before routing |
| CORS blocked (port 8080)         | All common dev ports allowed by default |
| All data was mock/hardcoded      | Every page now reads/writes to MongoDB |
| TestInterface used mock questions| Loads questions from DB, saves attempt to DB |
| College/Student pages used mock  | All pages use real API calls |

## Architecture

```
Frontend (React + Vite)          Backend (Express + MongoDB)
─────────────────────────        ──────────────────────────
Login          → POST /api/auth/login
AdminDashboard → GET  /api/exams, /api/users, /api/attempts
ExamManagement → POST /api/exams, /api/questions
UserManagement → POST /api/users, /api/users/colleges
StudentExams   → GET  /api/exams (published only)
TestInterface  → POST /api/attempts → POST /api/attempts/:id/submit
StudentResults → GET  /api/attempts/student/:id
CollegeDashboard→GET  /api/users/college/:id + attempts
```
