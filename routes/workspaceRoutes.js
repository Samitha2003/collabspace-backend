import {Router} from 'express';
import { createWorkspace, getWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace,addMember,removeMember } from '../controllers/workspaceController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.get('/:id', protect, getWorkspaceById);
router.put('/:id', protect, updateWorkspace);
router.delete('/:id', protect, deleteWorkspace);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:memberId', protect, removeMember);

