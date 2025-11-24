import mongoose from "mongoose";

// Variant sub-schema (Color + Storage)
const variantSchema = new mongoose.Schema({
  color: {
    type: [String],
    enum: ["Black", "Blue", "Red", "Green", "White", "Silver", "Gold", "Gray"],
    default: ["Black", "Blue", "Silver"],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "At least one color is required",
    },
  },
  storage: {
    type: [String],
    enum: ["32GB", "64GB", "128GB", "256GB", "512GB"],
    default: ["64GB", "128GB"],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "At least one storage option is required",
    },
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_-]+$/, "SKU can only contain letters, numbers, underscores, or hyphens"],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, "Stock cannot be negative"],
    validate: { validator: Number.isInteger, message: "Stock must be an integer" },
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    max: [500000, "Price cannot exceed 5,00,000"],
  },
});

// Mobile schema
const mobileSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"]
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      maxlength: [100, "Brand name too long"],
    },
    model: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
      unique: true,
      maxlength: [150, "Model name too long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
      default: null,
    },

    // Technical Specs
    ram: { type: String, required: true, enum: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
    processor: { type: String, required: true },
    battery: { type: String, required: true }, // Example: "5000mAh"
    camera: { type: String, default: null }, // Example: "50MP + 8MP + 2MP"
    display: { type: String, default: null }, // Example: "6.5-inch AMOLED"
    os: { type: String, default: "Android" },

    // Images
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: (v) => /^https?:\/\/.*\.(jpeg|jpg|png|webp)$/i.test(v),
            message: "Image must be URL ending with jpeg/jpg/png/webp",
          },
        },
        public_id: { type: String, required: true },
      },
    ],

    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued"],
      default: "Available",
    },

    variants: [variantSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Mobile", mobileSchema);
