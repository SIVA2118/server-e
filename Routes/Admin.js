import express from "express";
import {
  createSuperAdmin,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin
} from "../Controller/Admin.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

/* ==============================
   ONE-TIME SUPER ADMIN ROUTE
============================== */
// Create the first super admin (no auth required)
router.post("/create-superadmin", createSuperAdmin);

/* ==============================
   LOGIN
============================== */
// Admin login (super admin or admin)
router.post("/login", loginAdmin);

/* ==============================
   ADMIN MANAGEMENT (PROTECTED)
============================== */

// Create a new admin (only super admin)
router.post("/create", Auth, authorizeRoles("super admin"), createAdmin);

// Get all admins (only super admin)
router.get("/all", Auth, authorizeRoles("super admin"), getAdmins);

// Get a specific admin by ID (super admin & admin)
router.get("/byId/:id", Auth, authorizeRoles("super admin", "admin"), getAdminById);

// Update an admin by ID (only super admin)
router.put("/update/:id", Auth, authorizeRoles("super admin"), updateAdmin);

// Delete an admin by ID (only super admin)
router.delete("/delete/:id", Auth, authorizeRoles("super admin"), deleteAdmin);

export default router;
