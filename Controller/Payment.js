import Payment from "../Models/Payment.js";
import Order from "../Models/Order.js";
import razorpayInstance from "../Utils/razorpay.js";
import crypto from "crypto";
import { confirmOrderPayment, refundOrderPayment } from "./Order.js";

// --------------------------------------------------
// ✅ CREATE PAYMENT (Generate Razorpay Order)
// --------------------------------------------------
export const createPayment = async (req, res) => {
  try {
    const { orderId, method = "UPI" } = req.body;

    const order = await Order.findById(orderId).populate("payment");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prevent duplicate payment
    if (order.payment?.status === "paid") {
      return res.status(400).json({ message: "Payment already completed." });
    }

    // Remove failed / pending payments
    if (order.payment && ["failed", "created"].includes(order.payment.status)) {
      await Payment.findByIdAndDelete(order.payment._id);
    }

    // Create Razorpay Order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.total_amount * 100,
      currency: "INR",
      receipt: `order_rcpt_${order._id}`,
      payment_capture: 1,
    });

    // Save Payment to DB
    const payment = await Payment.create({
      order: order._id,
      amount: order.total_amount,
      currency: "INR",
      method,
      status: "created",
      razorpayOrderId: razorpayOrder.id,
    });

    order.payment = payment._id;
    await order.save();

    res.status(201).json({
      message: "Payment initialized. Complete payment to confirm order.",
      payment,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Create Payment Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------
// ✅ VERIFY PAYMENT USING SIGNATURE
// --------------------------------------------------
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Invalid signature" });

    // Update Payment
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    ).populate("order");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Confirm Order
    if (payment.order) {
      const result = await confirmOrderPayment(payment.order._id);
      if (!result.success)
        return res.status(500).json({ message: result.message });
    }

    res.json({ message: "Payment verified successfully", payment });
  } catch (error) {
    console.error("Verify Payment Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------
// ✅ REFUND PAYMENT
// --------------------------------------------------
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount * 100,
    });

    const payment = await Payment.findOne({
      razorpayPaymentId: paymentId,
    }).populate("order");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "refunded";
    await payment.save();

    if (payment.order) {
      await refundOrderPayment(payment.order._id, amount);
    }

    res.json({ message: "Refund processed successfully", refund });
  } catch (error) {
    console.error("Refund Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------
// ✅ RAZORPAY WEBHOOK (RAW BODY REQUIRED)
// --------------------------------------------------
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // RAW BUFFER from Express
    const body = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (expectedSignature !== receivedSignature) {
      console.log("Webhook Signature mismatch");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const data = JSON.parse(body.toString());

    const event = data.event;
    const entity = data.payload.payment.entity;

    const payment = await Payment.findOne({
      razorpayPaymentId: entity.id,
    }).populate("order");

    if (!payment)
      return res.status(404).json({ message: "Payment not found in DB" });

    // ---- Handle Events ----
    if (event === "payment.captured") {
      payment.status = "paid";
      await payment.save();

      if (payment.order) {
        payment.order.status = "confirmed";
        await payment.order.save();
      }
    }

    if (event === "payment.failed") {
      payment.status = "failed";
      await payment.save();

      if (payment.order) {
        payment.order.status = "pending";
        await payment.order.save();
      }
    }

    if (event === "payment.refunded") {
      payment.status = "refunded";
      await payment.save();

      if (payment.order) {
        payment.order.status = "refunded";
        await payment.order.save();
      }
    }

    res.json({ status: "Webhook processed" });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------
// ✅ GET PAYMENT BY ID
// --------------------------------------------------
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("order");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------
// ✅ GET ALL PAYMENTS (Pagination)
// --------------------------------------------------
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = status ? { status } : {};

    const payments = await Payment.find(query)
      .populate("order")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
