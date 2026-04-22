import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import adminRoutes from './routes/adminRoutes.js'
import { connectDatabase } from './database.js'
import authRoutes from './routes/authRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import { isDevelopmentEnv } from './utils/http.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 4000)
const authRateLimitMax = Number(
  process.env.AUTH_RATE_LIMIT_MAX || (isDevelopmentEnv() ? 0 : 50),
)
const corsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    if (isDevelopmentEnv() && corsOrigins.length === 0) {
      callback(null, true)
      return
    }

    if (corsOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('CORS origin not allowed.'))
  },
}

const authLimiter =
  Number.isInteger(authRateLimitMax) && authRateLimitMax > 0
    ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: authRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many authentication attempts. Please try again later.' },
    })
    : (_request, _response, next) => next()

app.use(cors(corsOptions))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/profiles', profileRoutes)

app.use('/api/*', (_request, response) => {
  response.status(404).json({ message: 'API route not found.' })
})

app.use((error, _request, response, _next) => {
  const payload = { message: 'Unexpected server error.' }

  if (isDevelopmentEnv() && error?.message) {
    payload.detail = error.message
  }

  response.status(500).json(payload)
})

async function startServer() {
  try {
    await connectDatabase()
    app.listen(port, () => {
      console.log(`Server is listening on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()