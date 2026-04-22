export function adminMiddleware(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Admin access required.' })
  }

  return next()
}
