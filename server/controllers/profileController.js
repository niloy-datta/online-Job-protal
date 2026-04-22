import { getPool } from '../database.js'
import { sendServerError, toPositiveInt } from '../utils/http.js'

function normalizeProfilePayload(userId, body) {
  return {
    userId,
    fullName: String(body.fullName || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    location: String(body.location || '').trim(),
    resumeFile: body.resumeFile ? String(body.resumeFile) : null,
    profileCompletion: Number(body.profileCompletion || 0),
    education: Array.isArray(body.education) ? body.education : [],
    skills: Array.isArray(body.skills) ? body.skills : [],
    experience: Array.isArray(body.experience) ? body.experience : [],
  }
}

function validateProfilePayload(payload) {
  const errors = {}

  if (!payload.fullName) {
    errors.fullName = 'Full name is required.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = 'A valid email address is required.'
  }

  if (payload.phone.length < 10) {
    errors.phone = 'A valid phone number is required.'
  }

  if (!payload.location) {
    errors.location = 'Location is required.'
  }

  return errors
}

export async function getProfileByUserId(request, response) {
  try {
    const userId = toPositiveInt(request.params.userId)
    const requestUserId = toPositiveInt(request.user?.id)

    if (!userId) {
      return response.status(400).json({ message: 'Valid user id is required.' })
    }

    if (!requestUserId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    if (requestUserId !== userId && request.user.role !== 'admin') {
      return response.status(403).json({ message: 'You are not allowed to access this profile.' })
    }

    const pool = getPool()
    const [profileRows] = await pool.query(
      `SELECT user_id, full_name, email, phone, location, resume_file, profile_completion
       FROM user_profiles
       WHERE user_id = ?`,
      [userId],
    )

    if (profileRows.length === 0) {
      return response.status(404).json({ message: 'Profile not found.' })
    }

    const [educationRows] = await pool.query(
      `SELECT id, degree, institute, passing_year AS year
       FROM education
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId],
    )

    const [skillRows] = await pool.query(
      `SELECT id, skill_name AS name
       FROM skills
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId],
    )

    const [experienceRows] = await pool.query(
      `SELECT id, role_title AS role, company_name AS company, duration_label AS period
       FROM experience
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId],
    )

    return response.json({
      userId,
      fullName: profileRows[0].full_name,
      email: profileRows[0].email,
      phone: profileRows[0].phone,
      location: profileRows[0].location,
      resumeFile: profileRows[0].resume_file,
      profileCompletion: profileRows[0].profile_completion,
      education: educationRows,
      skills: skillRows.map((row) => row.name),
      experience: experienceRows,
    })
  } catch (error) {
    return sendServerError(response, 'Failed to load profile.', error)
  }
}

export async function saveProfile(request, response) {
  const userId = toPositiveInt(request.params.userId)
  const requestUserId = toPositiveInt(request.user?.id)

  if (!userId) {
    return response.status(400).json({ message: 'Valid user id is required.' })
  }

  if (!requestUserId) {
    return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
  }

  if (requestUserId !== userId && request.user.role !== 'admin') {
    return response.status(403).json({ message: 'You are not allowed to update this profile.' })
  }

  const payload = normalizeProfilePayload(userId, request.body)
  const validationErrors = validateProfilePayload(payload)

  if (Object.keys(validationErrors).length > 0) {
    return response.status(400).json({ message: 'Invalid profile payload.', errors: validationErrors })
  }

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    await connection.query(
      `INSERT INTO user_profiles (user_id, full_name, email, phone, location, resume_file, profile_completion)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         email = VALUES(email),
         phone = VALUES(phone),
         location = VALUES(location),
         resume_file = VALUES(resume_file),
         profile_completion = VALUES(profile_completion)`,
      [
        payload.userId,
        payload.fullName,
        payload.email,
        payload.phone,
        payload.location,
        payload.resumeFile,
        payload.profileCompletion,
      ],
    )

    await connection.query('DELETE FROM education WHERE user_id = ?', [payload.userId])
    await connection.query('DELETE FROM skills WHERE user_id = ?', [payload.userId])
    await connection.query('DELETE FROM experience WHERE user_id = ?', [payload.userId])

    for (const item of payload.education) {
      await connection.query(
        `INSERT INTO education (user_id, degree, institute, passing_year)
         VALUES (?, ?, ?, ?)`,
        [payload.userId, item.degree, item.institute, item.year],
      )
    }

    for (const skill of payload.skills) {
      if (String(skill).trim()) {
        await connection.query(
          `INSERT INTO skills (user_id, skill_name)
           VALUES (?, ?)`,
          [payload.userId, String(skill).trim()],
        )
      }
    }

    for (const item of payload.experience) {
      await connection.query(
        `INSERT INTO experience (user_id, role_title, company_name, duration_label)
         VALUES (?, ?, ?, ?)`,
        [payload.userId, item.role, item.company, item.period],
      )
    }

    await connection.commit()

    return response.json({
      message: 'Profile saved successfully.',
      profile: {
        userId: payload.userId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        location: payload.location,
        resumeFile: payload.resumeFile,
        profileCompletion: payload.profileCompletion,
        education: payload.education,
        skills: payload.skills,
        experience: payload.experience,
      },
    })
  } catch (error) {
    await connection.rollback()
    return sendServerError(response, 'Failed to save profile.', error)
  } finally {
    connection.release()
  }
}