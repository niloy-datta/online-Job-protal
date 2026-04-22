import { Router } from 'express'
import { getAdminDashboardSummary, listApplications, updateApplicationStatus } from '../controllers/adminController.js'
import { adminMiddleware } from '../middleware/adminMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.use(adminMiddleware)

router.get('/dashboard', getAdminDashboardSummary)
router.get('/applications', listApplications)
router.patch('/applications/:applicationId/status', updateApplicationStatus)

export default router
