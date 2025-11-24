import Mobile from "../Models/Mobile.js";
import { v2 as cloudinary } from "cloudinary";

// Create Mobile
export const createMobile = async (req, res) => {
  try {
    const { brand, model, description, status, ram, processor, battery, camera, display, os, variants } = req.body;

    // Check duplicate model
    const existing = await Mobile.findOne({ model: model.trim() });
    if (existing) return res.status(400).json({ success: false, message: "Mobile model already exists" });

    // SKU duplicate check
    if (variants && variants.length > 0) {
      for (let v of variants) {
        const existingSku = await Mobile.findOne({ "variants.sku": v.sku });
        if (existingSku)
          return res.status(400).json({ success: false, message: `SKU ${v.sku} already exists` });
      }
    }

    const mobile = await Mobile.create({
      brand,
      model,
      description,
      ram,
      processor,
      battery,
      camera,
      display,
      os,
      status,
      variants: variants || [],
      images: [],
    });

    res.status(201).json({ success: true, message: "Mobile created successfully", data: mobile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Mobiles
export const getAllMobiles = async (req, res) => {
  try {
    let { search } = req.query;
    let query = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [{ brand: regex }, { model: regex }, { "variants.sku": regex }];
    }

    const mobiles = await Mobile.find(query).lean();
    if (!mobiles.length) return res.status(404).json({ success: false, message: "No mobiles found" });

    const formatted = mobiles.map(m => ({ ...m, images: m.images.map(img => img.url) }));
    res.json({ success: true, total: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mobile by ID
export const getMobileById = async (req, res) => {
  try {
    const mobile = await Mobile.findById(req.params.id).lean();
    if (!mobile) return res.status(404).json({ success: false, message: "Mobile not found" });

    res.json({ success: true, data: { ...mobile, images: mobile.images.map(img => img.url) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Mobile Image
export const uploadMobileImage = async (req, res) => {
  try {
    const { mobileId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    mobile.images.push({ url: req.file.path, public_id: req.file.filename });
    await mobile.save();

    res.json({ success: true, message: "Image uploaded successfully", data: mobile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Image
export const deleteMobileImage = async (req, res) => {
  try {
    const { mobileId, public_id } = req.body;
    if (!mobileId || !public_id) return res.status(400).json({ message: "mobileId & public_id required" });

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    await cloudinary.uploader.destroy(public_id);
    mobile.images = mobile.images.filter(img => img.public_id !== public_id);
    await mobile.save();

    res.json({ success: true, message: "Image deleted", images: mobile.images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Mobile
export const updateMobile = async (req, res) => {
  try {
    const { variants, removeImages } = req.body;
    const mobile = await Mobile.findById(req.params.id);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    Object.assign(mobile, req.body);

    // Remove Images
    if (removeImages?.length > 0) {
      for (let id of removeImages) {
        await cloudinary.uploader.destroy(id);
        mobile.images = mobile.images.filter(img => img.public_id !== id);
      }
    }

    // Add New Image
    if (req.file) mobile.images.push({ url: req.file.path, public_id: req.file.filename });

    if (variants) mobile.variants = variants;

    await mobile.save();
    res.json({ success: true, message: "Mobile updated successfully", data: mobile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Mobile
export const deleteMobile = async (req, res) => {
  try {
    const mobile = await Mobile.findByIdAndDelete(req.params.id);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    res.json({ success: true, message: "Mobile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stock Management
export const decreaseMobileStock = async (req, res) => {
  try {
    const { mobileId, variantSku, quantity } = req.body;
    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    const variant = mobile.variants.find(v => v.sku === variantSku);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    if (variant.stock < quantity)
      return res.status(400).json({ message: `Only ${variant.stock} items left` });

    variant.stock -= quantity;
    mobile.status = mobile.variants.reduce((sum, v) => sum + v.stock, 0) === 0 ? "Out of Stock" : "Available";

    await mobile.save();
    res.json({ success: true, message: `Stock decreased by ${quantity}`, data: mobile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const increaseMobileStock = async (req, res) => {
  try {
    const { mobileId, variantSku, quantity } = req.body;
    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    const variant = mobile.variants.find(v => v.sku === variantSku);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    variant.stock += quantity;
    mobile.status = "Available";

    await mobile.save();
    res.json({ success: true, message: `Stock increased by ${quantity}`, data: mobile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
