export function isDevelopmentEnv() {
  return process.env.NODE_ENV !== 'production'
}

export function sendServerError(response, message, error) {
  const payload = { message }

  if (isDevelopmentEnv() && error?.message) {
    payload.detail = error.message
  }

  return response.status(500).json(payload)
}

export function toPositiveInt(value) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}
