# Quick GitHub & Hosting Setup

## Prerequisites
- GitHub account (free)
- Vercel account (free)
- Railway account (free)

---

## STEP 1: Create GitHub Repo (Web)

1. Visit https://github.com/new
2. **Repository name**: `online-job-portal`
3. **Description**: Role-based job portal with React + Express
4. **Visibility**: Public
5. **Do NOT** check "Initialize this repository with:"
6. Click **Create Repository**

You'll see a page with instructions. Copy your HTTPS URL (looks like):
```
https://github.com/YOUR_USERNAME/online-job-portal.git
```

---

## STEP 2: Push to GitHub (Terminal)

```bash
cd "d:\react dbms project\online job portal"

# Configure git (if not done)
git config user.name "Your Name"
git config user.email "your@email.com"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/online-job-portal.git

# Rename branch
git branch -M main

# Push code
git push -u origin main
```

**Wait for completion!** You should see all files uploaded.

Visit https://github.com/YOUR_USERNAME/online-job-portal to verify ✓

---

## STEP 3: Deploy Frontend on Vercel

### 3a. Setup Vercel
1. Visit https://vercel.com
2. Click **Sign Up** (or Login)
3. Choose **Continue with GitHub**
4. Authorize Vercel

### 3b. Deploy Project
1. Click **Add New** > **Project**
2. Find and import `online-job-portal`
3. Settings:
   - Framework: Vite (auto-detected)
   - Build: `npm run build`
   - Output: `dist`
4. Click **Deploy**

**Wait 2-3 minutes...**

You'll get a URL like:
```
https://online-job-portal.vercel.app
```

✅ **Frontend is live!**

---

## STEP 4: Deploy Backend on Railway

### 4a. Setup Railway
1. Visit https://railway.app
2. Click **Login** (GitHub)
3. Authorize Railway

### 4b. Create Backend Project
1. Click **New Project**
2. **Deploy from GitHub repo**
3. Select `online-job-portal`
4. Railway auto-detects Node.js ✓

### 4c. Add Database
1. In Railway dashboard, click **+ Add**
2. Add **MySQL**
3. Railway creates MySQL instance

### 4d. Set Environment Variables
1. In Railway, go to **Variables**
2. Add these from your `.env.production`:

```
NODE_ENV=production
JWT_SECRET=generate-a-very-long-random-secret-here-32chars
DB_HOST=<get from MySQL service>
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<Railway provides this>
DB_NAME=job_portal_db
CORS_ORIGINS=https://your-vercel-frontend-url.vercel.app
```

3. Deploy

**Wait 2-3 minutes...**

You'll get a backend URL like:
```
https://your-project.railway.app
```

✅ **Backend is live!**

---

## STEP 5: Connect Frontend ↔ Backend

### 5a. Update Frontend in Vercel
1. Vercel Dashboard > Your Project
2. Go to **Settings** > **Environment Variables**
3. Add/Update:
   ```
   VITE_API_BASE_URL=https://your-project.railway.app/api
   ```
4. Click **Save**
5. Go to **Deployments** > Click latest > **Redeploy**

**Wait for redeploy...**

### 5b. Update Backend CORS in Railway
1. Railway > Variables
2. Update:
   ```
   CORS_ORIGINS=https://online-job-portal.vercel.app
   ```
3. Redeploy

---

## TEST YOUR WEBSITE

1. Visit your Vercel URL: `https://online-job-portal.vercel.app`
2. Register as **Recruiter** (role: employer)
3. Post a job
4. Logout
5. Register as **Candidate** (role: job_seeker)
6. Apply for the job
7. Logout → Login as recruiter
8. View applicants list

Everything working? ✅ **Your website is live 24/7!**

---

## Troubleshooting

### API 404 Error
- Check Vercel `VITE_API_BASE_URL` variable
- Make sure Railway URL is correct
- Redeploy Vercel

### Database Connection Error
- Check Railway MySQL credentials
- Verify database exists (`job_portal_db`)
- Check `DB_HOST` in Railway (get from MySQL service)

### CORS Error
- Update `CORS_ORIGINS` in Railway
- Must match your Vercel domain exactly
- Redeploy both services

### Port Already in Use
```bash
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

---

## Success! 🎉

Your fully hosted job portal is now:
- ✅ Accessible from anywhere
- ✅ Running 24/7
- ✅ Scalable with traffic
- ✅ Professional production setup

Share the URL: `https://your-domain.vercel.app`

