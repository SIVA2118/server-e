import Offer from "../Models/Offer.js";

// ✅ Create Offer
export const createOffer = async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).json({ message: "Offer created successfully", offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all offers
export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("category", "name")
      .populate("product", "name");
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate("category", "name")
      .populate("product", "name");
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update offer
export const updateOffer = async (req, res) => {
  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOffer) return res.status(404).json({ message: "Offer not found" });

    // Populate after update to return full details
    await updatedOffer.populate("category", "name");
    await updatedOffer.populate("product", "name");

    res.json({ message: "Offer updated successfully", updatedOffer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
    if (!deletedOffer) return res.status(404).json({ message: "Offer not found" });
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Validate Offer
export const validateOffer = async (req, res) => {
  try {
    const { couponcode } = req.body;
    if (!couponcode) return res.status(400).json({ message: "Coupon code is required" });

    const offer = await Offer.findOne({ couponcode });

    if (!offer) return res.status(404).json({ message: "Invalid coupon code" });

    if (new Date() > new Date(offer.expiry_date)) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (offer.usage_limit <= 0) {
      return res.status(400).json({ message: "Coupon usage limit exceeded" });
    }

    res.json({ success: true, message: "Coupon is valid", offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
