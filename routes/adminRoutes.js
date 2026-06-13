import {Router} from 'express';
import { getWorkspaceUsers, changeUserRole, removeUser, getAllUsers} from '../controllers/adminController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.get('/workspaces/:id/users', protect, getWorkspaceUsers);
router.patch('/workspaces/:workspaceId/users/:userId/role', protect, changeUserRole);
router.delete('/workspaces/:workspaceId/users/:userId', protect, removeUser);
router.get('/users', protect, getAllUsers);

export default router;