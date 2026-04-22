# Online Job Portal 💼

A modern, role-based job portal application with separate interfaces for candidates, recruiters, and administrators.

## Features ✨

- **Dual Role System**: Job Seekers & Recruiters
- **Job Management**: Post, browse, and apply for jobs
- **Applicant Tracking**: Recruiters view detailed candidate profiles
- **Profile Management**: Complete candidate profiles with education, skills, experience
- **Admin Dashboard**: Global application management and status tracking
- **Dark/Light Theme**: Modern UI with theme persistence
- **RBAC (Role-Based Access Control)**: Secure permission-based features
- **Real-time Data**: Profile-backed applicant information

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications

**Backend:**
- Express.js
- MySQL with mysql2/promise
- JWT authentication
- Rate limiting
- CORS support

## Prerequisites

- Node.js (v16+)
- MySQL Server (XAMPP recommended)
- Git

## Local Setup

### 1. Clone Repository
```bash
git clone <your-github-repo-url>
cd "online job portal"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=job_portal_db
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:5173,http://localhost:4000
AUTH_RATE_LIMIT_MAX=10
```

### 4. Start MySQL Service
- XAMPP: Start Apache & MySQL modules
- Or: `net start MySQL80` (Windows)

### 5. Start Backend Server
```bash
npm run server
```
Server runs on `http://localhost:4000`

### 6. Start Frontend (New Terminal)
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

## Database

Tables automatically created on first backend start:
- `users` - Accounts with roles
- `user_profiles` - Extended profile information
- `jobs` - Job listings
- `applications` - Job applications
- `education` - Candidate education history
- `skills` - Candidate skills
- `experience` - Candidate work experience

## User Roles

### Job Seeker
- Browse and search jobs
- Apply for jobs
- Manage profile (education, skills, experience)
- Track applications
- View dashboard metrics

### Recruiter/Employer
- Post new jobs
- View applicants for posted jobs
- See full candidate profiles
- Track application status
- Access recruiter dashboard

### Admin
- View all applications globally
- Filter by status and search
- Update application statuses
- System-wide analytics

## Default Users

Create via scripts:
```bash
node scripts/createAdminUser.mjs
```

Manual:
- **Candidate**: Email: candidate@test.com, Password: 123, Role: job_seeker
- **Recruiter**: Email: recruiter@test.com, Password: 123, Role: employer
- **Admin**: Created via script

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Post new job (recruiter only)
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/recruiter/applications` - View recruiter's applicants
- `GET /api/jobs/my/metrics` - Dashboard metrics

### Profiles
- `GET /api/profiles/:userId` - Get user profile
- `POST /api/profiles/:userId` - Save/update profile

### Admin
- `GET /admin/applications` - List all applications
- `PATCH /admin/applications/:id/status` - Update status
- `GET /admin/dashboard` - Admin summary

## Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
1. Push to GitHub
2. Import repo in Vercel
3. Set build: `npm run build`
4. Set output: `dist`
5. Deploy

**Backend on Railway:**
1. Connect GitHub repo
2. Add MySQL database plugin
3. Set environment variables
4. Deploy

**Update Frontend API Base:**
```javascript
// src/api/axiosConfig.js
const baseURL = 'https://your-railway-backend.com/api'
```

### Option 2: AWS EC2 + RDS

**EC2 Instance:**
```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Install Node & dependencies
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone your-repo
cd online-job-portal
npm install

# Setup environment
cp .env.example .env
# Edit .env with RDS credentials

# Build frontend
npm run build

# Install PM2
npm install -g pm2

# Start server with PM2
pm2 start npm --name "job-portal" -- run server
pm2 startup
pm2 save
```

**RDS Database:**
- Create MySQL instance
- Update `.env` DB credentials
- Database tables auto-create

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "server"]
```

Build and run:
```bash
docker build -t job-portal .
docker run -p 4000:4000 -e DB_HOST=mysql-host job-portal
```

## Project Structure

```
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── context/           # React context (Auth, Theme)
│   ├── api/              # API configuration
│   └── App.jsx           # Main app
├── server/               # Express backend
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & RBAC
│   └── database.js       # DB setup
├── scripts/              # Utility scripts
└── package.json          # Dependencies
```

## Troubleshooting

### Port 4000 in use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :4000
kill -9 <PID>
```

### MySQL Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists: `CREATE DATABASE job_portal_db;`

### Frontend API Errors
- Check backend is running on port 4000
- Verify CORS_ORIGINS includes frontend URL
- Check browser console for 401/403 errors

## Future Enhancements

- Email notifications
- File upload (resumes)
- Interview scheduling
- Messaging system
- Application pagination
- Advanced search filters
- Two-factor authentication
- Application analytics
- Job recommendations

## Contributing

1. Create feature branch: `git checkout -b feature/YourFeature`
2. Commit changes: `git commit -m 'Add YourFeature'`
3. Push branch: `git push origin feature/YourFeature`
4. Open Pull Request

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues or questions:
1. Check README and docs
2. Review API endpoint documentation
3. Check database schema in `server/database.js`
4. Create GitHub issue with details

---

**Version**: 1.0.0  
**Last Updated**: April 22, 2026
