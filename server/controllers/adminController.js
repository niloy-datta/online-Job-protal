import { getPool } from '../database.js'
import { sendServerError, toPositiveInt } from '../utils/http.js'

const VALID_STATUSES = new Set(['Pending', 'Reviewed', 'Shortlisted', 'Rejected'])

export async function getAdminDashboardSummary(_request, response) {
  try {
    const pool = getPool()

    const [[usersCountRows], [jobsCountRows], [applicationsCountRows], [recentApplicationsRows], [statusRows], [topJobsRows]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query('SELECT COUNT(*) AS total FROM jobs'),
      pool.query('SELECT COUNT(*) AS total FROM applications'),
      pool.query('SELECT COUNT(*) AS total FROM applications WHERE applied_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      pool.query(
        `SELECT status, COUNT(*) AS total
         FROM applications
         GROUP BY status`,
      ),
      pool.query(
        `SELECT
           jobs.id,
           jobs.title,
           jobs.company,
           COUNT(applications.id) AS applications_count
         FROM jobs
         LEFT JOIN applications ON applications.job_id = jobs.id
         GROUP BY jobs.id, jobs.title, jobs.company
         ORDER BY applications_count DESC, jobs.id DESC
         LIMIT 5`,
      ),
    ])

    const statusBreakdown = {
      Pending: 0,
      Reviewed: 0,
      Shortlisted: 0,
      Rejected: 0,
    }

    for (const row of statusRows) {
      if (Object.prototype.hasOwnProperty.call(statusBreakdown, row.status)) {
        statusBreakdown[row.status] = Number(row.total)
      }
    }

    return response.json({
      summary: {
        users: Number(usersCountRows[0]?.total || 0),
        jobs: Number(jobsCountRows[0]?.total || 0),
        applications: Number(applicationsCountRows[0]?.total || 0),
        recentApplications: Number(recentApplicationsRows[0]?.total || 0),
      },
      statusBreakdown,
      topJobs: topJobsRows.map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        applicationsCount: Number(row.applications_count || 0),
      })),
    })
  } catch (error) {
    return sendServerError(response, 'Failed to load admin dashboard summary.', error)
  }
}

export async function listApplications(request, response) {
  try {
    const pool = getPool()
    const status = String(request.query.status || '').trim()
    const q = String(request.query.q || '').trim()

    if (status && !VALID_STATUSES.has(status)) {
      return response.status(400).json({ message: 'Invalid status filter.' })
    }

    const conditions = []
    const params = []

    if (status) {
      conditions.push('applications.status = ?')
      params.push(status)
    }

    if (q) {
      const likeQuery = `%${q}%`
      conditions.push(`(
        users.name LIKE ?
        OR users.email LIKE ?
        OR user_profiles.full_name LIKE ?
        OR user_profiles.email LIKE ?
        OR jobs.title LIKE ?
        OR jobs.company LIKE ?
      )`)
      params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.query(
      `SELECT
         applications.id,
         applications.status,
         applications.applied_at,
         applications.user_id,
         applications.job_id,
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
         jobs.title AS job_title,
         jobs.company AS job_company,
         jobs.location AS job_location
       FROM applications
       INNER JOIN users ON users.id = applications.user_id
       INNER JOIN jobs ON jobs.id = applications.job_id
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       LEFT JOIN (
         SELECT user_id, GROUP_CONCAT(CONCAT(degree, ' - ', institute, ' (', passing_year, ')') ORDER BY id SEPARATOR ' | ') AS education_text
         FROM education
         GROUP BY user_id
       ) AS education_summary ON education_summary.user_id = users.id
       ${whereClause}
       ORDER BY applications.applied_at DESC
       LIMIT 300`,
      params,
    )

    return response.json({ applications: rows })
  } catch (error) {
    return sendServerError(response, 'Failed to load applications.', error)
  }
}

export async function updateApplicationStatus(request, response) {
  try {
    const pool = getPool()
    const applicationId = toPositiveInt(request.params.applicationId)
    const status = String(request.body.status || '').trim()

    if (!applicationId) {
      return response.status(400).json({ message: 'Valid application id is required.' })
    }

    if (!VALID_STATUSES.has(status)) {
      return response.status(400).json({ message: 'Invalid status value.' })
    }

    const [result] = await pool.query(
      `UPDATE applications
       SET status = ?
       WHERE id = ?`,
      [status, applicationId],
    )

    if (result.affectedRows === 0) {
      return response.status(404).json({ message: 'Application not found.' })
    }

    return response.json({ message: 'Application status updated successfully.' })
  } catch (error) {
    return sendServerError(response, 'Failed to update application status.', error)
  }
}
