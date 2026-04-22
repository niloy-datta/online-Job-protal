import { Router } from 'express'
import { getProfileByUserId, saveProfile } from '../controllers/profileController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/:userId', getProfileByUserId)
router.post('/:userId', saveProfile)

export default router