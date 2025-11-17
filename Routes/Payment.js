import express from "express";
import {
  createPayment,
  verifyRazorpayPayment,
  refundPayment,
  razorpayWebhook,
  getPaymentById,
  getAllPayments
} from "../Controller/Payment.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";
import bodyParser from "body-parser";

const router = express.Router();

// ✅ Create a payment for an order
router.post("/create", Auth, createPayment);

// ✅ Verify payment (after successful Razorpay payment)
router.post("/verify", Auth, verifyRazorpayPayment);

// ✅ Refund a payment (admin only)
router.post("/refund", Auth, authorizeRoles("super admin", "admin"), refundPayment);

// ✅ Razorpay Webhook (no auth needed)
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }), // <-- this is critical
  razorpayWebhook
);

// ✅ Get all payments (admin only)  <-- MUST come before /:id
router.get("/all", Auth, authorizeRoles("admin"), getAllPayments);

// ✅ Get payment by ID
router.get("/:id", Auth, getPaymentById);

export default router;
