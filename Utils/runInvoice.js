import { generateInvoicePDF } from "./generateInvoice.js";
import fs from "fs";

const order = {
  _id: "12345",
  user: { firstName: "Sivakumar", lastName: "S", email: "sivakumar@example.com" },
  address: { street: "Palladam", city: "Coimbatore", state: "TN", pincode: "641664", phone: "8807427126" },
  orderItems: [
    { product: { name: "Product 1" }, price: 100, quantity: 2 },
    { product: { name: "Product 2" }, price: 50, quantity: 3 },
  ],
};

const fileName = `Invoice_${order.user.firstName}_${order._id}.pdf`;

const run = async () => {
  const { buffer, path } = await generateInvoicePDF(order, fileName);
  fs.writeFileSync(path, buffer);
  console.log("Invoice saved at:", path);
};

run();
