import {Router} from 'express';
import { createColumn, updateColumn, deleteColumn } from '../controllers/columnController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.post('/', protect, createColumn);
router.put('/:id', protect, updateColumn);
router.delete('/:id', protect, deleteColumn);