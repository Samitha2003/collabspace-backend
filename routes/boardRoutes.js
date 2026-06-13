import {Router} from 'express';
import { createBoard, getBoards, getBoardById, updateBoard, deleteBoard } from '../controllers/boardController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.route('/')
    .get(protect, getBoards)
    .post(protect, createBoard);

router.route('/:id')
    .get(protect, getBoardById)
    .put(protect, updateBoard)
    .delete(protect, deleteBoard);

export default router;