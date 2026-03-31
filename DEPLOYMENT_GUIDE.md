# 🚀 ExamMaster Pro — Deployment Guide
## Frontend → Vercel | Backend → Render | Database → MongoDB Atlas

---

## OVERVIEW

```
MongoDB Atlas (Database)
        ↑
Render.com  (Backend API — Node/Express)
        ↑
Vercel.com  (Frontend — React/Vite)
```

---

## STEP 1 — MongoDB Atlas (Free Database)

### 1.1 Create a Free Cluster
1. Go to **https://cloud.mongodb.com** → Sign up / Log in
2. Click **"Build a Database"** → Choose **M0 FREE** tier
3. Select a cloud provider (AWS recommended) and a region near you
4. Cluster Name: `exammaster` → Click **"Create"**

### 1.2 Create Database User
1. In the left sidebar → **Database Access** → **"Add New Database User"**
2. Authentication: **Password**
3. Username: `exammaster_user`
4. Password: Click **"Autogenerate Secure Password"** — **COPY IT NOW**
5. Role: **"Atlas admin"** → Click **"Add User"**

### 1.3 Whitelist All IPs (for Render)
1. Left sidebar → **Network Access** → **"Add IP Address"**
2. Click **"Allow Access from Anywhere"** → IP: `0.0.0.0/0`
3. Comment: `Render backend` → **"Confirm"**

### 1.4 Get Your Connection String
1. Left sidebar → **Database** → Click **"Connect"** on your cluster
2. Choose **"Drivers"** → Driver: **Node.js**, Version: **5.5 or later**
3. Copy the connection string — it looks like:
   ```
   mongodb+srv://exammaster_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the password you copied in Step 1.2
5. **Save this full string** — you'll need it in Step 2.

---

## STEP 2 — Backend on Render (Free)

### 2.1 Push Backend to GitHub

**On your computer**, open a terminal:

```bash
# Navigate to the backend folder
cd exammaster-final/backend

# Initialize a git repo
git init
git add .
git commit -m "Initial backend commit"

# Create a new repo on GitHub:
# Go to https://github.com/new
# Name it: exammaster-backend
# Keep it PRIVATE
# Do NOT add README or .gitignore (already done)

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/exammaster-backend.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy on Render

1. Go to **https://render.com** → Sign up / Log in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account → Select **exammaster-backend** repo
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `exammaster-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

5. Click **"Advanced"** → **"Add Environment Variable"** — add all of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | *(your full Atlas connection string from Step 1.4)* |
| `DB_NAME` | `exammaster` |
| `JWT_SECRET` | *(any long random string, e.g., `x7k2mP9qR4nL8vW3jA6cF1dH5bG0eI`)* |
| `CORS_ORIGIN` | *(leave blank for now — you'll add Vercel URL in Step 4)* |

6. Click **"Create Web Service"**
7. Wait 2–4 minutes for the build to complete
8. Your backend URL will be: `https://exammaster-backend.onrender.com`
9. **Test it**: Open `https://exammaster-backend.onrender.com/api/health` in your browser
   - You should see: `{"status":"OK","message":"ExamMaster Pro API is running",...}`
10. **Copy this URL** — you need it in Step 3.

> ⚠️ **Free Render Note**: Free services sleep after 15 minutes of inactivity and take ~30s to wake up.
> Upgrade to Starter ($7/mo) to keep it always-on.

---

## STEP 3 — Frontend on Vercel

### 3.1 Push Frontend to GitHub

**On your computer**, open a new terminal:

```bash
# Navigate to the frontend folder (the root, not backend)
cd exammaster-final

# Initialize a git repo
git init
git add .
git commit -m "Initial frontend commit"

# Create a new repo on GitHub:
# Go to https://github.com/new
# Name it: exammaster-frontend
# Keep it PRIVATE

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/exammaster-frontend.git
git branch -M main
git push -u origin main
```

### 3.2 Deploy on Vercel

1. Go to **https://vercel.com** → Sign up / Log in with GitHub
2. Click **"Add New…"** → **"Project"**
3. Select **exammaster-frontend** from your GitHub repos → Click **"Import"**
4. Vercel auto-detects Vite — verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` (leave default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Expand **"Environment Variables"** → Add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://exammaster-backend.onrender.com/api` |

   *(Replace with your actual Render URL from Step 2.8)*

6. Click **"Deploy"**
7. Wait 1–2 minutes
8. Your frontend URL will be: `https://exammaster-frontend.vercel.app`
9. **Copy this URL** — you need it in Step 4.

---

## STEP 4 — Connect Frontend ↔ Backend (CORS Fix)

Now tell the backend to accept requests from your Vercel URL:

1. Go to **https://render.com** → Your `exammaster-backend` service
2. Click **"Environment"** in the left sidebar
3. Find `CORS_ORIGIN` and set its value to your Vercel URL:
   ```
   https://exammaster-frontend.vercel.app
   ```
   *(If you have multiple Vercel preview URLs, separate them with commas)*
4. Click **"Save Changes"** — Render will automatically redeploy (takes ~1 minute)

---

## STEP 5 — Test Everything

Open your Vercel URL in a browser:

1. **Login page loads** ✅
2. **Login as admin** — use the seed credentials or create one via:
   ```
   POST https://exammaster-backend.onrender.com/api/auth/register
   Body: {"name":"Admin","email":"admin@exam.com","password":"Admin@123","role":"admin"}
   ```
3. **Admin dashboard loads with data** ✅
4. **PDF/PPT/Magazine/Media tabs work** ✅

---

## STEP 6 — Custom Domain (Optional)

### Vercel Custom Domain
1. Vercel Dashboard → Your project → **"Settings"** → **"Domains"**
2. Add your domain: `www.yourdomain.com`
3. Follow the DNS instructions Vercel shows you
4. Update `CORS_ORIGIN` in Render to include your custom domain

### Backend Custom Domain on Render
1. Render Dashboard → Your service → **"Settings"** → **"Custom Domains"**
2. Add: `api.yourdomain.com`
3. Update `VITE_API_URL` in Vercel to `https://api.yourdomain.com/api`

---

## ENVIRONMENT VARIABLES REFERENCE

### Backend (Render)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=exammaster
JWT_SECRET=some_very_long_random_secret_string_32chars_minimum
CORS_ORIGIN=https://exammaster-frontend.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://exammaster-backend.onrender.com/api
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **Login fails / "Network Error"** | Check `VITE_API_URL` in Vercel matches your Render URL exactly |
| **CORS error in browser console** | Check `CORS_ORIGIN` in Render matches your Vercel URL exactly |
| **MongoDB connection fails** | Check `MONGODB_URI` has the correct password, and `0.0.0.0/0` is whitelisted in Atlas |
| **Render service crashes** | Check Render logs → Likely `JWT_SECRET` or `MONGODB_URI` is missing |
| **Vercel build fails** | Check the build log — usually a TypeScript error. Run `npm run build` locally first |
| **API returns 404 on all routes** | Make sure `vercel.json` exists and has the `rewrites` rule |
| **Backend wakes up slowly** | First request after 15 min idle takes ~30s on free Render plan |

---

## QUICK LINKS AFTER DEPLOYMENT

| Service | URL |
|---------|-----|
| Frontend | `https://exammaster-frontend.vercel.app` |
| Backend API | `https://exammaster-backend.onrender.com/api` |
| Health Check | `https://exammaster-backend.onrender.com/api/health` |
| MongoDB Atlas | `https://cloud.mongodb.com` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Render Dashboard | `https://dashboard.render.com` |

