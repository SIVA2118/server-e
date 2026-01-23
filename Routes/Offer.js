import express from "express";
import {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  validateOffer
} from "../Controller/Offer.js";

import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Auth, authorizeRoles("admin", "super admin"), createOffer);       // Create Offer
router.post("/validate", validateOffer); // ✅ Validate Offer
router.get("/all", getAllOffers);       // Get all Offers
router.get("/Id/:id", getOfferById);    // Get one Offer
router.put("/update/:id", Auth, authorizeRoles("admin", "super admin"), updateOffer);     // Update Offer
router.delete("/delete/:id", Auth, authorizeRoles("admin", "super admin"), deleteOffer);  // Delete Offer

export default router;
