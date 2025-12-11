// Utils/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage with NO FILE SIZE LIMIT + ALL FORMATS
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "boutique/carousel",
      // Accept ANY image format
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff", "ico", "jfif", "pjpeg", "heif", "heic"],

      // OPTIONAL: If you want ALL formats without restriction:
      // resource_type: "auto",

      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

// ❌ Remove file size limit
export const upload = multer({
  storage,
  limits: false,  // No size limit
});
