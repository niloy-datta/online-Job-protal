import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER ? process.env.DB_USER : 'root',
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'job_portal_db',
})

try {
  const [rows] = await pool.query(
    "SELECT id, email FROM users WHERE email LIKE 'admin%@example.com' ORDER BY id DESC LIMIT 1",
  )

  if (!rows.length) {
    console.log('admin_user_not_found')
    process.exit(0)
  }

  const adminUser = rows[0]
  await pool.query('UPDATE users SET role = ? WHERE id = ?', ['admin', adminUser.id])
  console.log(`admin_promoted=${adminUser.email}`)
} finally {
  await pool.end()
}
