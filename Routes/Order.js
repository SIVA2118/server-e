import express from "express";
import {
  createOrder, getOrderById, updateOrder, deleteOrder, getAllOrders,
  confirmOrderPayment, refundOrderPayment, updateShipment
} from "../Controller/Order.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

// 🆕 Create Order
router.post("/create", Auth, createOrder);

// 📌 Get all (Admin can see all, User only their own)
router.get("/all", Auth, getAllOrders);

// 📌 Get by ID
router.get("/byId/:id", Auth, getOrderById);

// ✏ Update Order by ID
router.put("/update/:id", Auth, updateOrder);

// ❌ Delete Order by ID
router.delete("/delete/:id", Auth, deleteOrder);

// 💳 Confirm Payment + Invoice Email
router.post("/confirm/:id", Auth, async (req, res) => {
  const result = await confirmOrderPayment(req.params.id);
  if (result.success) return res.json(result);
  res.status(500).json(result);
});

// 💵 Refund Payment + Email
router.post("/refund/:id", Auth, async (req, res) => {
  const { amount } = req.body;
  const result = await refundOrderPayment(req.params.id, amount);
  if (result.success) return res.json(result);
  res.status(500).json(result);
});

// 🚚 Update Shipment (Admin Only)
router.put(
  "/shipment/:id",
  Auth,
  authorizeRoles("admin", "super admin"),
  updateShipment
);


export default router;
