import { getPool } from '../database.js'
import { sendServerError, toPositiveInt } from '../utils/http.js'

export async function getMyDashboardMetrics(request, response) {
  try {
    const pool = getPool()
    const userId = toPositiveInt(request.user?.id)

    if (!userId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    const [[appliedRows], [profileRows]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM applications WHERE user_id = ?', [userId]),
      pool.query('SELECT profile_completion FROM user_profiles WHERE user_id = ? LIMIT 1', [userId]),
    ])

    return response.json({
      metrics: {
        appliedJobs: Number(appliedRows[0]?.total || 0),
        savedJobs: null,
        profileCompletion: Number(profileRows[0]?.profile_completion || 0),
      },
    })
  } catch (error) {
    return sendServerError(response, 'Failed to load dashboard metrics.', error)
  }
}

export async function getAllJobs(request, response) {
  try {
    const pool = getPool()
    const keyword = String(request.query.q || '').trim()
    const location = String(request.query.location || '').trim()
    const type = String(request.query.type || '').trim()

    const conditions = []
    const params = []

    if (keyword) {
      conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ?)')
      const keywordLike = `%${keyword}%`
      params.push(keywordLike, keywordLike, keywordLike)
    }

    if (location) {
      conditions.push('location LIKE ?')
      params.push(`%${location}%`)
    }

    if (type) {
      conditions.push('type = ?')
      params.push(type)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.query(
      `SELECT id, title, company, location, salary, type, description
       FROM jobs
       ${whereClause}
       ORDER BY id DESC`,
      params,
    )

    return response.json({ jobs: rows })
  } catch (error) {
    return sendServerError(response, 'Failed to load jobs.', error)
  }
}

export async function applyForJob(request, response) {
  try {
    const pool = getPool()
    const jobId = toPositiveInt(request.params.id)
    const userId = toPositiveInt(request.user?.id)

    if (!jobId) {
      return response.status(400).json({ message: 'Valid job id is required.' })
    }

    if (!userId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    const [jobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [jobId])

    if (jobs.length === 0) {
      return response.status(404).json({ message: 'Job not found.' })
    }

    const [existingApplications] = await pool.query(
      'SELECT id FROM applications WHERE user_id = ? AND job_id = ?',
      [userId, jobId],
    )

    if (existingApplications.length > 0) {
      return response.status(400).json({ message: 'You have already applied for this job.' })
    }

    await pool.query(
      `INSERT INTO applications (user_id, job_id, status)
       VALUES (?, ?, 'Pending')`,
      [userId, jobId],
    )

    return response.status(201).json({ message: 'Application submitted successfully.' })
  } catch (error) {
    return sendServerError(response, 'Failed to apply for job.', error)
  }
}

export async function createJob(request, response) {
  try {
    const pool = getPool()
    const userId = toPositiveInt(request.user?.id)
    const { title, company, location, salary, type, description } = request.body

    if (!userId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    const titleStr = String(title || '').trim()
    const companyStr = String(company || '').trim()
    const locationStr = String(location || '').trim()
    const salaryStr = String(salary || '').trim()
    const typeStr = String(type || '').trim()
    const descStr = String(description || '').trim()

    if (!titleStr || !companyStr || !locationStr || !salaryStr || !typeStr || !descStr) {
      return response.status(400).json({ message: 'All fields are required.' })
    }

    const [result] = await pool.query(
      `INSERT INTO jobs (recruiter_id, title, company, location, salary, type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, titleStr, companyStr, locationStr, salaryStr, typeStr, descStr],
    )

    return response.status(201).json({
      message: 'Job posted successfully.',
      job: {
        id: result.insertId,
        title: titleStr,
        company: companyStr,
        location: locationStr,
        salary: salaryStr,
        type: typeStr,
        description: descStr,
      },
    })
  } catch (error) {
    return sendServerError(response, 'Failed to post the job.', error)
  }
}

export async function getRecruiterApplications(request, response) {
  try {
    const pool = getPool()
    const recruiterId = toPositiveInt(request.user?.id)

    if (!recruiterId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    const [rows] = await pool.query(
      `SELECT
         applications.id,
         applications.status,
         applications.applied_at,
         users.id AS applicant_id,
         COALESCE(NULLIF(user_profiles.full_name, ''), users.name) AS applicant_name,
         COALESCE(NULLIF(user_profiles.email, ''), users.email) AS applicant_email,
         users.name AS applicant_account_name,
         users.email AS applicant_account_email,
         COALESCE(NULLIF(user_profiles.full_name, ''), users.name) AS applicant_profile_name,
         COALESCE(NULLIF(user_profiles.email, ''), users.email) AS applicant_profile_email,
         user_profiles.phone AS applicant_phone,
         user_profiles.location AS applicant_location,
         user_profiles.profile_completion AS applicant_profile_completion,
         COALESCE(education_summary.education_text, '') AS applicant_education,
         COALESCE(skill_summary.skills_text, '') AS applicant_skills,
         COALESCE(experience_summary.experience_text, '') AS applicant_experience,
         jobs.id AS job_id,
         jobs.title AS job_title,
         jobs.company AS job_company,
         jobs.location AS job_location
       FROM applications
       INNER JOIN jobs ON jobs.id = applications.job_id
       INNER JOIN users ON users.id = applications.user_id
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       LEFT JOIN (
         SELECT user_id, GROUP_CONCAT(CONCAT(degree, ' - ', institute, ' (', passing_year, ')') ORDER BY id SEPARATOR ' | ') AS education_text
         FROM education
         GROUP BY user_id
       ) AS education_summary ON education_summary.user_id = users.id
       LEFT JOIN (
         SELECT user_id, GROUP_CONCAT(skill_name ORDER BY id SEPARATOR ', ') AS skills_text
         FROM skills
         GROUP BY user_id
       ) AS skill_summary ON skill_summary.user_id = users.id
       LEFT JOIN (
         SELECT user_id, GROUP_CONCAT(CONCAT(role_title, ' @ ', company_name, ' (', duration_label, ')') ORDER BY id SEPARATOR ' | ') AS experience_text
         FROM experience
         GROUP BY user_id
       ) AS experience_summary ON experience_summary.user_id = users.id
       WHERE jobs.recruiter_id = ?
       ORDER BY applications.applied_at DESC`,
      [recruiterId],
    )

    return response.json({ applications: rows })
  } catch (error) {
    return sendServerError(response, 'Failed to load recruiter applications.', error)
  }
}
