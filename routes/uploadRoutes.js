import { Router } from "express";
import protect from "../middleware/protect.js";
import upload from "../middleware/upload.js";
import { uploadFile } from "../controllers/uploadController.js";

const router = Router();

router.post("/upload", protect, upload.single("file"), uploadFile);

export default router;