import express from "express";
import {
  createMobile,
  getAllMobiles,
  getMobileById,
  updateMobile,
  deleteMobile,
  decreaseMobileStock,
  increaseMobileStock,
  uploadMobileImage,
  deleteMobileImage,
} from "../Controller/Mobile.js";

import { Auth, authorizeRoles } from "../Middleware/Auth.js";
import { upload } from "../Utils/cloud.js";

const router = express.Router();

// Create
router.post("/create", Auth, authorizeRoles("admin", "super admin"), createMobile);

// Read
router.get("/all", getAllMobiles);
router.get("/byId/:id", Auth, authorizeRoles("user", "admin", "super admin"), getMobileById);

// Update
router.put("/update/:id", Auth, authorizeRoles("admin", "super admin"), updateMobile);

// Delete
router.delete("/delete/:id", Auth, authorizeRoles("super admin"), deleteMobile);

// Stock
router.post("/stock/decrease", Auth, authorizeRoles("admin", "super admin"), decreaseMobileStock);
router.post("/stock/increase", Auth, authorizeRoles("admin", "super admin"), increaseMobileStock);

// Images
router.post("/upload", Auth, authorizeRoles("admin", "super admin"), upload.single("file"), uploadMobileImage);
router.post("/delete-image", Auth, authorizeRoles("admin", "super admin"), deleteMobileImage);

export default router;
