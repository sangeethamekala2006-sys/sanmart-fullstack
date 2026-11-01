
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  },
  addresses: [addressSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  language: { type: String, default: "English" },
  notifications: {
    email: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    offers: { type: Boolean, default: false }
  }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, default: "General" },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const orderAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine: String,
  city: String,
  state: String,
  pincode: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: String,
    price: Number,
    quantity: Number
  }],

  amountPaise: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },

  paymentMethod: {
    type: String,
    enum: ["razorpay", "cod", "mock"],
    default: "razorpay"
  },

  shippingAddress: orderAddressSchema,

  razorpayOrderId: String,
  razorpayPaymentId: String

}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Product = mongoose.model("Product", productSchema);
export const Order = mongoose.model("Order", orderSchema);
