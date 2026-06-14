import {Router} from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import protect from '../middleware/protect.js';

const router = Router();
router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);
export default router;
