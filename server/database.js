import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_portal_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
}

let pool

const defaultJobs = [
  {
    title: 'Frontend Developer (React)',
    company: 'TechNova Ltd.',
    location: 'Dhaka, Bangladesh',
    salary: 'BDT 55,000 - 75,000',
    type: 'Full-time',
    description: 'Build responsive React interfaces and collaborate with product and backend teams.',
  },
  {
    title: 'Backend Engineer (Node.js)',
    company: 'CloudAxis',
    location: 'Chattogram, Bangladesh',
    salary: 'BDT 70,000 - 95,000',
    type: 'Full-time',
    description: 'Develop secure REST APIs, optimize MySQL queries, and maintain core services.',
  },
  {
    title: 'UI/UX Designer',
    company: 'PixelForge Studio',
    location: 'Remote',
    salary: 'BDT 45,000 - 60,000',
    type: 'Remote',
    description: 'Design user flows, wireframes, and modern dashboards for recruitment products.',
  },
  {
    title: 'Junior Data Analyst',
    company: 'InsightBridge',
    location: 'Sylhet, Bangladesh',
    salary: 'BDT 40,000 - 58,000',
    type: 'Full-time',
    description: 'Analyze hiring data trends and create reports to support recruitment decisions.',
  },
]

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL DEFAULT 'job_seeker',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    location VARCHAR(120) NOT NULL,
    resume_file VARCHAR(255) DEFAULT NULL,
    profile_completion INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    degree VARCHAR(160) NOT NULL,
    institute VARCHAR(190) NOT NULL,
    passing_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_education_profile FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_skills_profile FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_title VARCHAR(160) NOT NULL,
    company_name VARCHAR(190) NOT NULL,
    duration_label VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_profile FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT DEFAULT NULL,
    title VARCHAR(190) NOT NULL,
    company VARCHAR(190) NOT NULL,
    location VARCHAR(160) NOT NULL,
    salary VARCHAR(120) NOT NULL,
    type VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT uq_applications_user_job UNIQUE (user_id, job_id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
]

const charsetStatements = [
  `ALTER DATABASE \`${databaseConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE user_profiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE education CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE skills CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE experience CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE jobs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `ALTER TABLE applications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
]

async function seedJobsIfEmpty(activePool) {
  const [rows] = await activePool.query('SELECT COUNT(*) AS total FROM jobs')
  const total = Number(rows[0]?.total || 0)

  if (total > 0) {
    return
  }

  for (const job of defaultJobs) {
    await activePool.query(
      `INSERT INTO jobs (recruiter_id, title, company, location, salary, type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [null, job.title, job.company, job.location, job.salary, job.type, job.description],
    )
  }
}

async function ensureRecruiterColumn(activePool) {
  const [columns] = await activePool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'recruiter_id'`,
    [databaseConfig.database],
  )

  if (columns.length === 0) {
    await activePool.query('ALTER TABLE jobs ADD COLUMN recruiter_id INT DEFAULT NULL')
  }
}

export async function connectDatabase() {
  try {
    const bootstrapConnection = await mysql.createConnection({
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      password: databaseConfig.password,
    })

    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await bootstrapConnection.end()

    pool = mysql.createPool(databaseConfig)

    await pool.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

    for (const statement of schemaStatements) {
      await pool.query(statement)
    }

    await ensureRecruiterColumn(pool)

    for (const statement of charsetStatements) {
      await pool.query(statement)
    }

    await seedJobsIfEmpty(pool)

    return pool
  } catch (error) {
    if (error?.code === 'ECONNREFUSED') {
      throw new Error(
        `MySQL is not reachable at ${databaseConfig.host}:${databaseConfig.port}. Start MySQL service and verify DB_HOST/DB_PORT in .env.`,
      )
    }

    if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error('MySQL authentication failed. Verify DB_USER and DB_PASSWORD in .env.')
    }

    throw error
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized yet.')
  }

  return pool
}
