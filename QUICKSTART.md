# 🚀 ExamMaster Pro - Quick Start (5 minutes)

## Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)

## Step 1: Get MongoDB URI (2 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster
4. Get connection string: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/exammaster?retryWrites=true&w=majority`

## Step 2: Backend Setup (1 minute)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and paste MongoDB URI
npm run dev
```

✅ Backend running on http://localhost:5000

## Step 3: Frontend Setup (1 minute)

```bash
# From project root (new terminal)
npm install
cp .env.example .env
npm run dev
```

✅ Frontend running on http://localhost:5173

## Step 4: Login (1 minute)

Open http://localhost:5173

**Login with:**
- Email: `admin@example.com`
- Password: `admin123456`

## Done! 🎉

You now have:
- ✅ Express API with MongoDB
- ✅ React frontend
- ✅ Exam management system
- ✅ Student tracking
- ✅ Results & analytics

## What's Next?

1. Create a college
2. Create students
3. Create an exam
4. Add questions
5. Students take exams
6. View results

## Useful Links

- Backend API: http://localhost:5000/api/health
- Full Setup: [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- Backend Docs: [backend/README.md](./backend/README.md)
- API Endpoints: See backend/README.md

## Troubleshooting

**MongoDB Error?**
- Check your connection string in .env
- Verify IP whitelist in MongoDB Atlas

**Port 5000 in use?**
- Kill the process: `lsof -i :5000` then `kill -9 <PID>`
- Or change PORT in .env

**API not connecting?**
- Verify backend is running: http://localhost:5000/api/health
- Check VITE_API_URL in frontend .env

## Questions?

See COMPLETE_SETUP_GUIDE.md for detailed troubleshooting.

Happy Exams! 📚
