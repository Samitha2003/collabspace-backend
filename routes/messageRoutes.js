import {Router} from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);