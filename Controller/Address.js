import Address from "../Models/Address.js";
import User from "../Models/User.js";

// -------------------- CREATE ADDRESS --------------------
export const createAddress = async (req, res) => {
  try {
    const { user_id, street, city, state, pincode, country, phone, is_default } = req.body;

    if (req.user.role.toLowerCase() === "user" && req.user._id.toString() !== user_id) {
      return res.status(403).json({ message: "Users can only create their own addresses" });
    }

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (is_default) {
      await Address.updateMany({ user_id }, { is_default: false });
    }

    const address = await Address.create({
      user_id,
      street,
      city,
      state,
      pincode,
      country,
      phone,
      is_default,
    });

    res.status(201).json({ message: "Address created successfully", address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- GET ALL ADDRESSES --------------------
export const getAllAddresses = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    if (!["admin", "super admin"].includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: "Access denied" });
    }

    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { street: regex },
        { city: regex },
        { state: regex },
        { country: regex },
        { pincode: regex },
        { phone: regex },
      ];
    }

    const total = await Address.countDocuments(query);
    const addresses = await Address.find(query)
      .populate("user_id", "name email")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- GET USER ADDRESSES --------------------
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.role.toLowerCase() === "user" && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { search, page, limit } = req.query;
    let skip = 0;
    if (page && limit) skip = (Number(page) - 1) * Number(limit);

    const query = { user_id: userId };
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { street: regex },
        { city: regex },
        { state: regex },
        { country: regex },
        { pincode: regex },
        { phone: regex },
      ];
    }

    const total = await Address.countDocuments(query);
    let addressesQuery = Address.find(query).lean();

    if (limit) {
      addressesQuery = addressesQuery.skip(skip).limit(Number(limit));
    }

    const addresses = await addressesQuery;

    res.json({
      success: true,
      total,
      page: page ? Number(page) : 1,
      pages: limit ? Math.ceil(total / limit) : 1,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- UPDATE ADDRESS --------------------
export const updateAddress = async (req, res) => {
  try {
    const { street, city, state, pincode, country, phone, is_default } = req.body;
    const address = await Address.findById(req.params.id);

    if (!address) return res.status(404).json({ message: "Address not found" });

    if (req.user.role.toLowerCase() === "user" && req.user._id.toString() !== address.user_id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (is_default) {
      await Address.updateMany({ user_id: address.user_id }, { is_default: false });
    }

    Object.assign(address, { street, city, state, pincode, country, phone, is_default });
    await address.save();

    res.json({ message: "Address updated successfully", address });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DELETE ADDRESS --------------------
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (req.user.role.toLowerCase() === "user" && req.user._id.toString() !== address.user_id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Address.deleteOne({ _id: req.params.id });
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
