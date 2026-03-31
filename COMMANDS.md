# ⚡ ExamMaster — Exact Commands to Deploy

## Prerequisites (install once)
```bash
# Install Node.js (if not already)
node -v        # should be v18+

# Install Git (if not already)
git --version

# Install Vercel CLI
npm install -g vercel

# Install Render CLI (optional — we'll use dashboard for Render)
```

---

## 📁 STEP 1 — Extract & Navigate

```bash
# After extracting the zip, go into the project folder
cd exammaster
```

---

## 🗄️ STEP 2 — Set Up MongoDB Atlas (do this first)

1. Go to https://cloud.mongodb.com → Sign up free
2. Create cluster → M0 Free → any region
3. Database Access → Add User → Username: `exammaster_user` → Autogenerate password → COPY IT
4. Network Access → Add IP → 0.0.0.0/0 (allow everywhere)
5. Connect → Drivers → Copy connection string:
   `mongodb+srv://exammaster_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace <PASSWORD> with your copied password — SAVE THIS STRING

---

## 🖥️ STEP 3 — Deploy Backend to GitHub + Render

```bash
# Go into backend folder
cd backend

# Initialize git
git init
git add .
git commit -m "ExamMaster backend - initial commit"

# Push to GitHub (create repo at https://github.com/new first)
# Repo name: exammaster-backend   Private: yes
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/exammaster-backend.git
git branch -M main
git push -u origin main

# Go back to project root
cd ..
```

**Now on Render (https://render.com):**
1. New → Web Service → Connect GitHub → Select exammaster-backend
2. Settings:
   - Name: `exammaster-backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`
3. Environment Variables → Add:
   ```
   NODE_ENV        = production
   MONGODB_URI     = mongodb+srv://exammaster_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   DB_NAME         = exammaster
   JWT_SECRET      = ExamMaster2024SecretKey_ChangeThisToSomethingRandom_Min32Chars
   CORS_ORIGIN     = (leave blank for now — add after Step 4)
   ```
4. Click "Create Web Service" → wait ~3 minutes
5. Test: open https://exammaster-backend.onrender.com/api/health
   → Should show: {"status":"OK","message":"ExamMaster Pro API is running"}
6. COPY YOUR RENDER URL: https://exammaster-backend.onrender.com

---

## ⚡ STEP 4 — Deploy Frontend to GitHub + Vercel

```bash
# From the project root (not inside backend)
git init
git add .
git commit -m "ExamMaster frontend - initial commit"

# Push to GitHub (create repo at https://github.com/new first)
# Repo name: exammaster-frontend   Private: yes
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/exammaster-frontend.git
git branch -M main
git push -u origin main

# Deploy with Vercel CLI
vercel login          # opens browser — log in with GitHub

vercel                # run from project root
```

**Answer Vercel prompts like this:**
```
? Set up and deploy "exammaster"? → Y
? Which scope? → (select your account)
? Link to existing project? → N
? What's your project's name? → exammaster-frontend
? In which directory is your code located? → ./
? Want to modify settings? → Y
  Build Command: npm run build
  Output Dir:    dist
  Dev Command:   npm run dev
```

```bash
# Set the backend URL environment variable
vercel env add VITE_API_URL production
# When prompted, enter:
# https://exammaster-backend.onrender.com/api

# Redeploy with the env var applied
vercel --prod
```

**Copy your Vercel URL:** https://exammaster-frontend.vercel.app

---

## 🔗 STEP 5 — Connect Frontend ↔ Backend (CORS)

Go to Render dashboard → exammaster-backend → Environment → Edit CORS_ORIGIN:
```
CORS_ORIGIN = https://exammaster-frontend.vercel.app
```
Click "Save Changes" → Render auto-redeploys in ~1 minute

---

## 👤 STEP 6 — Create First Admin Account

```bash
# Run this command once to create your admin account
curl -X POST https://exammaster-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@exammaster.com","password":"Admin@1234","role":"admin"}'
```

Expected response:
```json
{"success":true,"message":"User created successfully","data":{...}}
```

---

## ✅ DONE — Your App is Live!

| What | URL |
|------|-----|
| 🌐 Frontend | https://exammaster-frontend.vercel.app |
| 🔌 Backend  | https://exammaster-backend.onrender.com |
| ❤️ Health   | https://exammaster-backend.onrender.com/api/health |

Login at your Vercel URL:
- Email: admin@exammaster.com
- Password: Admin@1234

---

## 🔄 Future Updates

### Update backend:
```bash
cd backend
git add .
git commit -m "update: description of change"
git push
# Render auto-deploys on every push to main
```

### Update frontend:
```bash
# from project root
git add .
git commit -m "update: description of change"
git push
# Vercel auto-deploys on every push to main
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| Login fails / Network Error | Check VITE_API_URL in Vercel matches Render URL exactly |
| CORS error in browser | Check CORS_ORIGIN in Render matches Vercel URL exactly |
| MongoDB connection fails | Check MONGODB_URI has correct password + 0.0.0.0/0 whitelisted |
| Vercel build fails | Run `npm run build` locally first to catch errors |
| Backend takes 30s to respond | Free Render sleeps after 15min idle — upgrade to Starter ($7/mo) |

