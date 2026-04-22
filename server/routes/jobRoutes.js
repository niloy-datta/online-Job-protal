import { Router } from 'express'
import { applyForJob, createJob, getAllJobs, getMyDashboardMetrics, getRecruiterApplications } from '../controllers/jobController.js'
import { employerOrAdminMiddleware } from '../middleware/employerMiddleware.js'
import { jobSeekerMiddleware } from '../middleware/jobSeekerMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/my/metrics', getMyDashboardMetrics)
router.get('/recruiter/applications', employerOrAdminMiddleware, getRecruiterApplications)
router.get('/', getAllJobs)
router.post('/', employerOrAdminMiddleware, createJob)
router.post('/:id/apply', jobSeekerMiddleware, applyForJob)

export default router
