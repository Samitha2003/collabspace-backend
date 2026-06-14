import { Router } from "express";
import protect from "../middleware/protect.js";
import upload from "../middleware/upload.js";
import { uploadFile } from "../controllers/uploadController.js";
import multer from "multer";

const router = Router();

router.post("/", protect, (req, res, next) => {
  const uploadMiddleware = upload.single("file");
  
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading (e.g. file too large).
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred or our custom fileFilter error
      return res.status(400).json({ message: err.message });
    }
    
    // Everything went fine, proceed to the controller
    next();
  });
}, uploadFile);

export default router;