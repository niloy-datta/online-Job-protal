@echo off
REM GitHub Push & Deployment Script for Windows
REM Run this after creating your GitHub repository

echo.
echo ====== Online Job Portal: GitHub ^& Deployment Setup ======
echo.
echo Step 1: Create GitHub Repository
echo Visit: https://github.com/new
echo Repository name: online-job-portal
echo Description: Role-based job portal with React + Express
echo Visibility: Public
echo Do NOT initialize with README (we have one)
echo.
pause
cls
echo.
echo Step 2: GitHub Commands
echo ========================
echo.
echo IMPORTANT: Replace YOUR_USERNAME with your actual GitHub username
echo.
echo Copy and paste these commands one by one:
echo.
echo Command 1:
echo git remote add origin https://github.com/YOUR_USERNAME/online-job-portal.git
echo.
echo Command 2:
echo git branch -M main
echo.
echo Command 3:
echo git push -u origin main
echo.
pause
cls
echo.
echo Step 3: Deploy Frontend on Vercel (https://vercel.com)
echo ======================================================
echo.
echo 1. Sign in with GitHub
echo 2. Click "New Project"
echo 3. Import your online-job-portal repository
echo 4. Framework: Vite (auto-detected)
echo 5. Build Command: npm run build
echo 6. Output Directory: dist
echo 7. Click Deploy
echo.
echo SAVE YOUR FRONTEND URL (e.g., https://online-job-portal.vercel.app)
echo.
pause
cls
echo.
echo Step 4: Deploy Backend on Railway (https://railway.app)
echo ========================================================
echo.
echo 1. Sign in with GitHub
echo 2. New Project
echo 3. Deploy from GitHub repo
echo 4. Select online-job-portal
echo 5. Add MySQL plugin
echo 6. Configure environment variables (see .env.production)
echo 7. Deploy
echo.
echo SAVE YOUR BACKEND URL (e.g., https://your-project.railway.app)
echo.
pause
cls
echo.
echo Step 5: Connect Frontend to Backend
echo ===================================
echo.
echo In Vercel Dashboard:
echo  Settings ^> Environment Variables
echo  Add: VITE_API_BASE_URL = https://YOUR_BACKEND_URL/api
echo  Redeploy
echo.
echo In Railway Dashboard:
echo  Variables
echo  Add: CORS_ORIGINS = https://YOUR_FRONTEND_URL
echo.
echo ====== SETUP COMPLETE! ======
echo.
echo Your website is now live and accessible 24/7!
echo.
pause
