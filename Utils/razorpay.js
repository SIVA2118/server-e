import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// 🔒 Validate environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error(
    "❌ Razorpay keys missing! Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
  );
  process.exit(1);
}

// ✅ Create Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;
