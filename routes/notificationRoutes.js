import {Router} from 'express';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/notificationController.js';
import protect from '../middleware/protect.js';

const router = Router();
router.get('/', protect, getNotifications);
router.get('/count', protect, getUnreadCount);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);
export default router;
