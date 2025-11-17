import Order from "../Models/Order.js";
import OrderItem from "../Models/Orderitem.js";
import Payment from "../Models/Payment.js";
import mongoose from "mongoose";
import { sendEmail } from "../Utils/sendemail.js";
import { generateInvoicePDF } from "../Utils/generateInvoice.js";
import fs from "fs";


// ✅ Create Order using existing OrderItem IDs
export const createOrder = async (req, res) => {
  try {
    const { user, address, orderItems, total_amount, notes } = req.body;

    // Validate inputs
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: "Order items are required" });

    if (!user || !address)
      return res.status(400).json({ message: "User and address are required" });

    // ✅ Ensure all orderItem IDs exist in the DB
    const existingItems = await OrderItem.find({
      _id: { $in: orderItems }
    });

    if (existingItems.length !== orderItems.length) {
      return res.status(400).json({ message: "One or more OrderItem IDs are invalid" });
    }

    // ✅ Create the Order
    const order = await Order.create({
      user,
      address,
      orderItems,
      total_amount,
      notes
    });

    // ✅ Populate full order details
    const fullOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("address")
      .populate({
        path: "orderItems",
        populate: { path: "product", select: "name price" }
      });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: fullOrder
    });

  } catch (error) {
    console.error("Create Order Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email role")
      .populate("address")
      .populate({ path: "orderItems", populate: { path: "product", select: "name price" } })
      .populate("offer")
      .populate("payment");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Use req.user.id instead of req.user._id
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Authorization required" });

    if (req.user.role === "user") {
      if (!order.user || !order.user._id)
        return res.status(400).json({ message: "Order has no user assigned" });

      if (order.user._id.toString() !== req.user.id.toString())
        return res.status(403).json({ message: "Access denied" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get Order By ID Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Order (safe update)
export const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate("user")
    .populate("address")
    .populate({ path: "orderItems", populate: { path: "product" } })
    .populate("offer")
    .populate("payment");

    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Order (User can delete only their own order)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if logged-in user's email matches order owner's email
    if (!req.user || order.user.email !== req.user.email) {
      return res.status(403).json({ message: "You can only delete your own order" });
    }

    await OrderItem.deleteMany({ order: order._id });
    if (order.payment) await Payment.findByIdAndUpdate(order.payment, { status: "cancelled" });

    order.status = "cancelled";
    await order.save();
    await Order.findByIdAndDelete(order._id);

    res.json({ success: true, message: "Order and related items deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const { page, limit, search, status, paymentStatus, startDate, endDate } = req.query;

    // ✅ Check authorization
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Authorization required" });

    // ✅ Build query
    let query = {};

    if (search) {
      query.$or = [];
      if (mongoose.Types.ObjectId.isValid(search)) query.$or.push({ _id: search });
      if (mongoose.Types.ObjectId.isValid(search)) query.$or.push({ user: search });
      query.$or.push({ "user.name": { $regex: search, $options: "i" } });
      query.$or.push({ "user.email": { $regex: search, $options: "i" } });
    }

    if (status) query.status = status;

    // ✅ Restrict users to their own orders
    if (req.user.role === "user") query.user = req.user.id;

    if (startDate || endDate) query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);

    // ✅ Pagination
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 0; // 0 means no limit, return all

    let ordersQuery = Order.find(query)
      .populate("user", "name email")
      .populate("address")
      .populate({ path: "orderItems", populate: { path: "product" } })
      .populate("offer")
      .populate("payment")
      .sort({ createdAt: -1 });

    if (perPage > 0) {
      ordersQuery = ordersQuery.skip((currentPage - 1) * perPage).limit(perPage);
    }

    let orders = await ordersQuery;

    if (paymentStatus) {
      orders = orders.filter(o => o.payment?.status === paymentStatus);
    }

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      page: currentPage,
      limit: perPage > 0 ? perPage : total,
      total,
      totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Confirm order payment and send email
export const confirmOrderPayment = async (orderId) => {
  try {
    // ✅ Fetch order with all required details
    const order = await Order.findById(orderId)
      .populate("user", "firstName lastName email")
      .populate("address") // ✅ populate address too!
      .populate({
        path: "orderItems",
        populate: { path: "product", select: "name price" }
      });

    // ✅ If order not found
    if (!order) {
      console.log("Order not found for ID:", orderId);
      return { success: false, message: "Order not found" };
    }

    // ✅ Ensure user exists
    if (!order.user) {
      console.log("ERROR: Order has NO USER field. Fix order creation logic.");
      return { success: false, message: "Order has no assigned user" };
    }

    // ✅ Ensure address exists
    if (!order.address) {
      console.log("ERROR: Order has NO ADDRESS field. Fix order creation logic.");
      return { success: false, message: "Order has no assigned address" };
    }

    // ✅ Update order status
    order.status = "confirmed";
    await order.save();

    // ✅ Generate invoice PDF (includes address + phone)
    const pdfPath = await generateInvoicePDF(order);

    // ✅ Prepare user data safely
    const userFirst = order.user.firstName || "Customer";
    const userLast = order.user.lastName || "";
    const userName = `${userFirst} ${userLast}`.trim();

    // ✅ Email the user only if email exists
    if (order.user.email) {
      const subject = `Your Order #${order._id} is Confirmed`;
      const text = `Hi ${userName}, your payment is confirmed. Invoice attached.`;

      const html = `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #4CAF50;">Order Confirmed ✅</h2>
          <p>Hello <b>${userName}</b>,</p>
          <p>Your payment has been confirmed and your invoice is attached.</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Total:</b> ₹${order.total_amount}</p>
          <br/>
          <p><b>Delivery Address:</b><br/>
            ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}<br/>
            📞 ${order.address.phone}
          </p>
        </div>
      `;

      await sendEmail(order.user.email, subject, text, html, pdfPath);
    }

    // ✅ Delete PDF file after sending (cleanup)
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    return {
      success: true,
      message: "Order confirmed, invoice generated and emailed successfully.",
      order
    };

  } catch (error) {
    console.error("Confirm Order Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ✅ Refund order payment and send email
export const refundOrderPayment = async (orderId, amount) => {
  try {
    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return { success: false, message: "Order not found" };

    order.status = "refunded";
    await order.save();

    if (order.user?.email) {
      await sendEmail(order.user.email, `Order #${order._id} Refunded`, `Hi ${order.user.name}, your payment for Order ID ${order._id} has been refunded. Amount: ₹${amount}`);
    }

    return { success: true, message: "Order refunded and email sent", order };
  } catch (error) {
    console.error("Refund Order Error:", error.message);
    return { success: false, message: error.message };
  }
};
