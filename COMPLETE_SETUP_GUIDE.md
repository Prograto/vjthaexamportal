# ExamMaster Pro - Complete Setup Guide with MongoDB Atlas

Complete guide to set up and run the full ExamMaster Pro application with MongoDB Atlas integration.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ExamMaster Pro                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐          ┌────────────────────┐    │
│  │   Frontend       │          │   Backend API      │    │
│  │  (React + Vite)  │◄────────►│  (Express.js)      │    │
│  │  Port: 5173      │          │  Port: 5000        │    │
│  └──────────────────┘          └────────────────────┘    │
│                                         │                 │
│                                         │                 │
│                              ┌──────────▼──────────┐      │
│                              │  MongoDB Atlas      │      │
│                              │  (Cloud Database)   │      │
│                              └─────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account

1. Visit https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with your email
4. Create organization name
5. Create project name

### Step 2: Create Database Cluster

1. After login, go to "Databases"
2. Click "Create" button
3. Choose "Free" tier (M0)
4. Select AWS as provider
5. Choose region closest to you
6. Click "Create Deployment"
7. Wait 3-5 minutes for cluster to be ready

### Step 3: Get Connection String

1. In Clusters, click "Connect"
2. Click "Connect your application"
3. Select:
   - Driver: Node.js
   - Version: 4.0 or later
4. Copy the connection string
5. Replace placeholders:
   - `<password>` → Your database password
   - `exammaster` → Database name (already set)

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/exammaster?retryWrites=true&w=majority
```

### Step 4: Configure IP Whitelist

1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Choose "Allow from anywhere" (0.0.0.0/0) for development
4. Click "Confirm"

Note: In production, use specific IP addresses only.

## Part 2: Backend Setup

### Step 1: Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your editor
```

Update these values:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB Atlas URI (from Part 1)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exammaster?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Frontend URL
CORS_ORIGIN=http://localhost:5173

# Admin Credentials (for first login)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### Step 3: Start Backend Server

```bash
# Start development server with auto-reload
npm run dev

# Output should show:
# ╔════════════════════════════════════════╗
# ║   ExamMaster Pro API Server Running    ║
# ║   🚀 Port: 5000                        ║
# ║   📨 API: http://localhost:5000/api    ║
# ║   ✅ Status: Ready for requests        ║
# ╚════════════════════════════════════════╝
```

### Step 4: Verify Backend is Running

Open in browser or terminal:

```bash
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"ExamMaster Pro API is running",...}
```

## Part 3: Frontend Setup

### Step 1: Install Frontend Dependencies

```bash
# From project root (not backend directory)
npm install
```

### Step 2: Configure Frontend Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit with your backend URL
nano .env
```

Set:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Frontend Server

```bash
# From project root
npm run dev

# Output should show:
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

### Step 4: Open Application

Visit: http://localhost:5173

## Part 4: First Time Usage

### Step 1: Admin Login

Use these credentials to login:

```
Email: admin@example.com
Password: admin123456
```

### Step 2: Create College

1. After login, go to "Admin Dashboard"
2. Click "User Management"
3. Click "Create College"
4. Fill in college details:
   - College Name
   - Email
   - Address
   - Phone
   - City/State
5. Click "Create"

### Step 3: Create Students

1. Go to "User Management"
2. Click "Create User"
3. Select Role: Student
4. Select College
5. Fill in:
   - Name
   - Email
   - Password
6. Click "Create"

### Step 4: Create Exam

1. Go to "Admin Dashboard"
2. Click "Exam Management"
3. Click "Create New Exam"
4. Fill in:
   - Exam Name (e.g., "JEE 2024")
   - Description
   - Total Marks
   - Duration
5. Click "Create"

### Step 5: Add Questions

1. Select the exam
2. Click "Add Questions"
3. Add manually or upload Excel
4. Fill in question details:
   - Question text
   - Options (A, B, C, D)
   - Correct answer
   - Marks
5. Click "Save"

### Step 6: Publish Exam

1. Select exam
2. Click "Publish"
3. Exam is now available for students

## Common Commands

### Backend Commands

```bash
# Development
cd backend
npm run dev          # Start with auto-reload

# Production
npm start            # Start server

# Testing
npm test             # Run tests (when added)
```

### Frontend Commands

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Create production build

# Preview
npm run preview      # Preview production build
```

## Troubleshooting

### Backend Issues

**Problem: MongoDB Connection Error**
```
Error: connect ECONNREFUSED
```
Solution:
1. Verify MongoDB Atlas URI is correct
2. Check IP whitelist allows your IP
3. Verify password doesn't have special characters
4. Check internet connection

**Problem: Port 5000 Already in Use**
```
Error: listen EADDRINUSE :::5000
```
Solution:
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port:
# Edit .env and change PORT=5001
```

**Problem: CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
Solution:
1. Check CORS_ORIGIN in backend .env
2. Verify frontend URL matches
3. Restart backend server

### Frontend Issues

**Problem: API Connection Error**
```
Failed to connect to http://localhost:5000/api
```
Solution:
1. Verify backend is running
2. Check VITE_API_URL in .env
3. Check frontend/backend ports are correct
4. Check firewall settings

**Problem: Login fails**
```
Invalid credentials
```
Solution:
1. Verify you're using correct admin email
2. Check .env file ADMIN_EMAIL
3. Clear browser cache
4. Try incognito mode

## Database Management

### View Database in MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Browse Collections"
4. View collections:
   - users
   - exams
   - questions
   - attempts
   - colleges

### MongoDB Shell Commands

```bash
# Connect to MongoDB
# (From MongoDB Atlas dashboard)

# View databases
show databases

# Select database
use exammaster

# View collections
show collections

# View users
db.users.find()

# View exams
db.exams.find()

# Clear a collection
db.attempts.deleteMany({})
```

## API Testing

### Using Postman

1. Download Postman
2. Create new collection
3. Set up variables:
   - `baseUrl`: http://localhost:5000/api
   - `token`: (get from login)
4. Create requests for each endpoint

### Sample Requests

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

**Get All Exams**
```bash
curl http://localhost:5000/api/exams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Exam**
```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "JEE Main 2024",
    "description": "Joint Entrance Examination",
    "totalQuestions": 90,
    "totalMarks": 300,
    "duration": 180,
    "sections": []
  }'
```

## Production Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create exammaster-api

# Set environment variables
heroku config:set MONGODB_URI=your_atlas_uri
heroku config:set JWT_SECRET=your_production_secret
heroku config:set CORS_ORIGIN=your_frontend_url

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Frontend Deployment (Vercel/Netlify)

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm run build
# Upload dist folder to Netlify
```

## Security Best Practices

1. **Change Default Credentials**
   - Change admin email/password in production
   - Use strong passwords

2. **Environment Variables**
   - Never commit .env files
   - Use different secrets for dev/prod
   - Rotate JWT_SECRET regularly

3. **Database**
   - Use specific IP addresses in production
   - Enable MongoDB Atlas encryption
   - Regular backups

4. **API**
   - Enable HTTPS in production
   - Implement rate limiting
   - Add request validation
   - Use CORS properly

## Performance Optimization

1. Enable MongoDB indexes for frequently queried fields
2. Implement pagination for large datasets
3. Cache exam data
4. Compress API responses
5. Use CDN for static files

## Monitoring

1. Set up error tracking (Sentry, Rollbar)
2. Monitor database performance in MongoDB Atlas
3. Set up alerts for API errors
4. Track user activity logs
5. Monitor server health

## Support Resources

- MongoDB Atlas Docs: https://docs.mongodb.com/manual/
- Express.js Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Vite Docs: https://vitejs.dev/

## Next Steps

1. Complete the setup above
2. Create test exams and questions
3. Invite colleges and students
4. Run exams and view results
5. Analyze performance data
6. Customize branding and features
7. Deploy to production

## FAQ

**Q: Can I change the database name?**
A: Yes, update both MongoDB Atlas and MONGODB_URI

**Q: How to backup data?**
A: MongoDB Atlas has automated backups. Access via console.

**Q: Can multiple instances run?**
A: Yes, use load balancer. Each instance connects to same MongoDB Atlas.

**Q: What's the database limit?**
A: Free tier: 512 MB. Paid plans offer more storage.

---

**Setup Complete! Your ExamMaster Pro is ready to use.** 🎉

For issues, check backend/README.md for API documentation.
