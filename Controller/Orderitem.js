import OrderItem from "../Models/Orderitem.js";

// Create
export const createOrderItem = async (req, res) => {
  try {
    const { order, product, quantity, price } = req.body;
    if (!order || !product || !quantity || !price) return res.status(400).json({ message: "Missing required fields" });

    const newOrderItem = await OrderItem.create({ order, product, quantity, price });
    res.status(201).json({ success: true, data: newOrderItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All
export const getAllOrderItems = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const findQuery = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const orderItems = await OrderItem.find()
      .populate({
        path: "product",
        select: "name price",
        match: findQuery
      })
      .populate("order", "status totalAmount")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const filteredItems = orderItems.filter(item => item.product);

    const total = await OrderItem.countDocuments();

    res.json({
      total,
      page,
      limit,
      data: filteredItems
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
export const getOrderItemById = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id)
      .populate("order", "status total_amount")
      .populate("product", "name price");

    if (!orderItem) {
      return res.status(404).json({ message: "Order Item not found" });
    }

    res.json(orderItem);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const updateOrderItem = async (req, res) => {
  try {
    const updated = await OrderItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order Item not found" });
    }

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
export const deleteOrderItem = async (req, res) => {
  try {
    const deleted = await OrderItem.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Order Item not found" });
    }

    res.json({ message: "Order Item deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
