import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// --------------------------------------------------
// ✅ Cloudinary Configuration
// --------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --------------------------------------------------
// ✅ Cloudinary Storage Configuration
// --------------------------------------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "boutique/carousel", // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  },
});

// --------------------------------------------------
// ✅ File Filter (Images only)
// --------------------------------------------------
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, JPEG, PNG, WEBP images are allowed"),
      false
    );
  }
};

// --------------------------------------------------
// ✅ Multer Upload (20MB limit)
// --------------------------------------------------
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // ✅ 20MB
  },
});
