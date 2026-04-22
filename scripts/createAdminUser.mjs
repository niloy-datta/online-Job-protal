import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

dotenv.config()

function envOr(key, fallback) {
  const value = process.env[key]
  return value === undefined || value === '' ? fallback : value
}

const email = process.argv[2]
const plainPassword = process.argv[3]
const name = process.argv[4] || 'Admin User'

if (!email || !plainPassword) {
  console.error('usage: node scripts/createAdminUser.mjs <email> <password> [name]')
  process.exit(1)
}

const pool = mysql.createPool({
  host: envOr('DB_HOST', 'localhost'),
  port: Number(envOr('DB_PORT', '3306')),
  user: envOr('DB_USER', 'root'),
  password: envOr('DB_PASSWORD', ''),
  database: envOr('DB_NAME', 'job_portal_db'),
})

try {
  const passwordHash = await bcrypt.hash(plainPassword, 10)
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email])

  if (rows.length === 0) {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'admin'],
    )
    console.log('admin_account_created')
  } else {
    await pool.query(
      'UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?',
      [name, passwordHash, 'admin', email],
    )
    console.log('admin_account_updated')
  }
} finally {
  await pool.end()
}
