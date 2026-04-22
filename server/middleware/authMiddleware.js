import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim()

  if (!secret) {
    throw new Error('JWT_SECRET is required.')
  }

  return secret
}

export function authMiddleware(request, response, next) {
  const authorization = request.headers.authorization || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ message: 'Authentication token is required.' })
  }

  try {
    const payload = jwt.verify(token, getJwtSecret())
    request.user = payload
    return next()
  } catch {
    return response.status(401).json({ message: 'Authentication token is invalid or expired.' })
  }
}