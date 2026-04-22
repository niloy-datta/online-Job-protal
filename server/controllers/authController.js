import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../database.js'
import { sendServerError, toPositiveInt } from '../utils/http.js'

const VALID_LOGIN_ROLES = new Set(['job_seeker', 'employer', 'admin'])
const VALID_REGISTER_ROLES = new Set(['job_seeker', 'employer'])

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim()

  if (!secret) {
    throw new Error('JWT_SECRET is required.')
  }

  return secret
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: '7d' },
  )
}

export async function register(request, response) {
  try {
    const name = String(request.body.name || request.body.fullName || '').trim()
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    const requestedRole = String(request.body.role || '').trim()
    const pool = getPool()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!name || !emailPattern.test(email)) {
      return response.status(400).json({ message: 'Name and a valid email are required.' })
    }

    if (!password) {
      return response.status(400).json({ message: 'Password is required.' })
    }

    if (!VALID_REGISTER_ROLES.has(requestedRole)) {
      return response.status(400).json({ message: 'Register role must be Candidate or Recruiter.' })
    }

    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email])

    if (existingUsers.length > 0) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, passwordHash, requestedRole],
    )

    return response.status(201).json({
      message: 'Registration successful. Please log in.',
      user: {
        id: result.insertId,
        name,
        email,
        role: requestedRole,
      },
    })
  } catch (error) {
    return sendServerError(response, 'Registration failed.', error)
  }
}

export async function login(request, response) {
  try {
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    const requestedRole = String(request.body.role || '').trim()
    const pool = getPool()

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required.' })
    }

    if (!VALID_LOGIN_ROLES.has(requestedRole)) {
      return response.status(400).json({ message: 'Login role must be Candidate, Recruiter, or Admin.' })
    }

    const [users] = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?`,
      [email],
    )

    if (users.length === 0) {
      return response.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = users[0]

    if (requestedRole !== user.role) {
      return response.status(403).json({ message: 'Selected role does not match this account.' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return response.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = createToken(user)

    return response.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return sendServerError(response, 'Login failed.', error)
  }
}

export async function me(request, response) {
  try {
    const pool = getPool()
    const userId = toPositiveInt(request.user?.id)

    if (!userId) {
      return response.status(401).json({ message: 'Authentication information is invalid. Please log in again.' })
    }

    const [users] = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = ?`,
      [userId],
    )

    if (users.length === 0) {
      return response.status(404).json({ message: 'User not found.' })
    }

    return response.json({ user: users[0] })
  } catch (error) {
    return sendServerError(response, 'Failed to fetch user profile.', error)
  }
}
