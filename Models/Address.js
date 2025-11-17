import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    street: {
      type: String,
      trim: true,
      default: null, // 🏠 new field added
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      trim: true,
      default: null,
    },
    pincode: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Please enter a valid phone number"],
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Use default export so you can import it directly
export default mongoose.model("Address", addressSchema);
