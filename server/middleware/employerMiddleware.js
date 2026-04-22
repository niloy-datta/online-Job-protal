const CREATE_JOB_ALLOWED_ROLES = new Set(['employer'])

export function employerOrAdminMiddleware(request, response, next) {
  if (!CREATE_JOB_ALLOWED_ROLES.has(request.user?.role)) {
    return response.status(403).json({ message: 'Only recruiters can post jobs.' })
  }

  return next()
}
