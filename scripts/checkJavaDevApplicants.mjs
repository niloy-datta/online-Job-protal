import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_portal_db',
}

async function main() {
  const conn = await mysql.createConnection(cfg)

  const [apps] = await conn.query(`
    SELECT 
      a.id, 
      a.user_id, 
      u.name, 
      u.email, 
      a.job_id, 
      j.title, 
      j.company, 
      a.status, 
      a.applied_at 
    FROM applications a 
    INNER JOIN users u ON a.user_id = u.id 
    INNER JOIN jobs j ON a.job_id = j.id 
    WHERE j.title = 'Java Developer' AND j.company = 'BrainCraft' 
    ORDER BY a.applied_at DESC
  `)

  console.log('Java Developer @ BrainCraft applicants:')
  console.log(JSON.stringify(apps, null, 2))

  const [dupCheck] = await conn.query(`
    SELECT user_id, job_id, COUNT(*) as cnt 
    FROM applications 
    WHERE job_id IN (SELECT id FROM jobs WHERE title = 'Java Developer' AND company = 'BrainCraft') 
    GROUP BY user_id, job_id 
    HAVING cnt > 1
  `)

  console.log('\nDuplicate checks (same user, same job):')
  if (dupCheck.length) {
    console.log(JSON.stringify(dupCheck, null, 2))
  } else {
    console.log('No duplicates found - both applicants are different users')
  }

  await conn.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
