export function jobSeekerMiddleware(request, response, next) {
  if (request.user?.role !== 'job_seeker') {
    return response.status(403).json({ message: 'Only candidates can apply for jobs.' })
  }

  return next()
}
