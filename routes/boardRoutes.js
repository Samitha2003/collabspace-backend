import {Router} from 'express';
import { createBoard, getBoards, getBoard, updateBoard, deleteBoard } from '../controllers/boardController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.route('/')
    .get(protect, getBoards)
    .post(protect, createBoard);

router.route('/:id')
    .get(protect, getBoard)
    .put(protect, updateBoard)
    .delete(protect, deleteBoard);

export default router;