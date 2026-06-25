import {Router} from 'express';
import { getCards, getCard, createCard, updateCard, moveCard, assignUser, unassignUser, deleteCard, deleteAttachment, addComment, deleteComment } from '../controllers/cardContoller.js';
import protect from '../middleware/protect.js';

const router = Router();

router.get('/:id', protect, getCard);
router.get('/', protect, getCards);
router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.patch('/move/:id', protect, moveCard);
router.patch('/assign/:id', protect, assignUser);
router.patch('/unassign/:id', protect, unassignUser);
router.delete('/:id', protect, deleteCard);
router.delete('/:id/attachment/:attachmentId', protect, deleteAttachment);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

export default router;