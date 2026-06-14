import cloudinary from "../config/cloudinary.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // convert buffer to base64 data URI
    const file = req.file;
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "collabspace",
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
    });

    return res.status(200).json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
    