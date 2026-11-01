import "dotenv/config";import express from "express";import cors from "cors";import mongoose from "mongoose";import bcrypt from "bcryptjs";import jwt from "jsonwebtoken";import Razorpay from "razorpay";import crypto from "node:crypto";import {User,Product,Order} from "./models.js";
const app=express(),PORT=process.env.PORT||5000,SECRET=process.env.JWT_SECRET;
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"}));app.use(express.json({limit:"1mb"}));
const token=u=>jwt.sign({id:String(u._id),role:u.role},SECRET,{expiresIn:"7d"}),safe=u=>({id:u._id,name:u.name,email:u.email,role:u.role});
function auth(req,res,next){try{const t=(req.headers.authorization||"").replace(/^Bearer /,"");if(!t)throw Error();req.user=jwt.verify(t,SECRET);next()}catch{return res.status(401).json({message:"Please sign in again."})}}
function admin(req,res,next){if(req.user?.role!=="admin")return res.status(403).json({message:"Admin access required."});next()}
function rp(){if(!process.env.RAZORPAY_KEY_ID||process.env.RAZORPAY_KEY_ID.includes("replace"))throw Error("Configure Razorpay Test Mode keys in .env");return new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET})}
app.get("/api/health",(_,res)=>res.json({ok:true,database:mongoose.connection.readyState===1?"connected":"disconnected"}));
app.post("/api/auth/register",async(req,res,next)=>{try{const {name,email,password}=req.body;if(!name?.trim()||!/^\S+@\S+\.\S+$/.test(email||"")||typeof password!=="string"||password.length<8)return res.status(400).json({message:"Enter name, valid email and password of 8+ characters."});if(await User.findOne({email:email.toLowerCase().trim()}))return res.status(409).json({message:"Email already registered."});const u=await User.create({name,email,passwordHash:await bcrypt.hash(password,12)});res.status(201).json({token:token(u),user:safe(u)})}catch(e){next(e)}});
app.post("/api/auth/login",async(req,res,next)=>{try{const u=await User.findOne({email:String(req.body.email||"").toLowerCase().trim()});if(!u||!await bcrypt.compare(String(req.body.password||""),u.passwordHash))return res.status(401).json({message:"Invalid email or password."});res.json({token:token(u),user:safe(u)})}catch(e){next(e)}});
app.get("/api/auth/me",auth,async(req,res,next)=>{try{const u=await User.findById(req.user.id);if(!u)return res.status(401).json({message:"Account not found"});res.json({user:safe(u)})}catch(e){next(e)}});

// GET CUSTOMER PROFILE
app.get("/api/profile", auth, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id)
      .populate("wishlist");

    if (!u) return res.status(404).json({ message: "User not found" });

    res.json({
      user: safe(u),
      addresses: u.addresses || [],
      wishlist: u.wishlist || [],
      language: u.language || "English",
      notifications: u.notifications
    });
  } catch (e) {
    next(e);
  }
});

// UPDATE PROFILE
app.put("/api/profile", auth, async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || "")) {
      return res.status(400).json({ message: "Enter a valid name and email." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id }
    });

    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const u = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email: normalizedEmail },
      { new: true, runValidators: true }
    );

    res.json({ user: safe(u) });
  } catch (e) {
    next(e);
  }
});

// ADD ADDRESS
app.post("/api/profile/addresses", auth, async (req, res, next) => {
  try {
    const fields = ["fullName", "phone", "addressLine", "city", "state", "pincode"];

    if (fields.some(k => !String(req.body[k] || "").trim())) {
      return res.status(400).json({ message: "Please complete all address fields." });
    }

    const u = await User.findById(req.user.id);
    const address = { ...req.body };

    if (address.isDefault) {
      u.addresses.forEach(a => { a.isDefault = false; });
    }

    if (!u.addresses.length) address.isDefault = true;

    u.addresses.push(address);
    await u.save();

    res.status(201).json({ addresses: u.addresses });
  } catch (e) {
    next(e);
  }
});

// EDIT ADDRESS
app.put("/api/profile/addresses/:id", auth, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id);
    const address = u.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ message: "Address not found." });

    if (req.body.isDefault) {
      u.addresses.forEach(a => { a.isDefault = false; });
    }

    ["fullName", "phone", "addressLine", "city", "state", "pincode", "isDefault"]
      .forEach(k => {
        if (req.body[k] !== undefined) address[k] = req.body[k];
      });

    await u.save();
    res.json({ addresses: u.addresses });
  } catch (e) {
    next(e);
  }
});

// DELETE ADDRESS
app.delete("/api/profile/addresses/:id", auth, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id);
    const address = u.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ message: "Address not found." });

    address.deleteOne();
    await u.save();

    res.json({ addresses: u.addresses });
  } catch (e) {
    next(e);
  }
});

// UPDATE LANGUAGE
app.put("/api/profile/language", auth, async (req, res, next) => {
  try {
    const allowed = ["English", "Tamil", "Hindi"];

    if (!allowed.includes(req.body.language)) {
      return res.status(400).json({ message: "Unsupported language." });
    }

    const u = await User.findByIdAndUpdate(
      req.user.id,
      { language: req.body.language },
      { new: true }
    );

    res.json({ language: u.language });
  } catch (e) {
    next(e);
  }
});

// UPDATE NOTIFICATION SETTINGS
app.put("/api/profile/notifications", auth, async (req, res, next) => {
  try {
    const notifications = {
      email: Boolean(req.body.email),
      orderUpdates: Boolean(req.body.orderUpdates),
      offers: Boolean(req.body.offers)
    };

    const u = await User.findByIdAndUpdate(
      req.user.id,
      { notifications },
      { new: true }
    );

    res.json({ notifications: u.notifications });
  } catch (e) {
    next(e);
  }
});

// ADD TO WISHLIST
app.post("/api/wishlist/:productId", auth, async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      active: true
    });

    if (!product) return res.status(404).json({ message: "Product not found." });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { wishlist: product._id }
    });

    res.json({ message: "Added to wishlist." });
  } catch (e) {
    next(e);
  }
});

// REMOVE FROM WISHLIST
app.delete("/api/wishlist/:productId", auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { wishlist: req.params.productId }
    });

    res.json({ message: "Removed from wishlist." });
  } catch (e) {
    next(e);
  }
});

app.get("/api/products",async(req,res,next)=>{try{let filter={active:true};if(req.query.category&&req.query.category!=="All")filter.category=req.query.category;if(req.query.q)filter.name={$regex:String(req.query.q).slice(0,80).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),$options:"i"};res.json({products:await Product.find(filter).sort({createdAt:-1}).limit(100)})}catch(e){next(e)}});
app.get("/api/products/categories",async(_,res,next)=>{try{res.json({categories:await Product.distinct("category",{active:true})})}catch(e){next(e)}});
app.post("/api/products",auth,admin,async(req,res,next)=>{try{const p=await Product.create(req.body);res.status(201).json({product:p})}catch(e){next(e)}});
app.put("/api/products/:id",auth,admin,async(req,res,next)=>{try{const p=await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!p)return res.status(404).json({message:"Product not found"});res.json({product:p})}catch(e){next(e)}});
app.delete("/api/products/:id",auth,admin,async(req,res,next)=>{try{if(!await Product.findByIdAndDelete(req.params.id))return res.status(404).json({message:"Product not found"});res.json({message:"Deleted"})}catch(e){next(e)}});
// CREATE COD OR MOCK PAYMENT ORDER
app.post("/api/orders", auth, async (req, res, next) => {
  const reserved = [];

  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      mockOutcome
    } = req.body;

    // Validate payment method
    if (!["cod", "mock"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method."
      });
    }

    // Mock payment is only for local development
    if (paymentMethod === "mock" && process.env.NODE_ENV === "production") {
      return res.status(403).json({
        message: "Mock payment is disabled in production."
      });
    }

    if (
      paymentMethod === "mock" &&
      !["success", "failed"].includes(mockOutcome)
    ) {
      return res.status(400).json({
        message: "Invalid mock payment result."
      });
    }

    // Validate address
    const addressFields = [
      "fullName",
      "phone",
      "addressLine",
      "city",
      "state",
      "pincode"
    ];

    if (
      !shippingAddress ||
      addressFields.some(
        field => !String(shippingAddress[field] || "").trim()
      )
    ) {
      return res.status(400).json({
        message: "Please select a complete delivery address."
      });
    }

    // Validate cart
    if (!Array.isArray(items) || !items.length || items.length > 50) {
      return res.status(400).json({
        message: "Your cart is empty or invalid."
      });
    }

    // Combine duplicate product IDs
    const quantities = new Map();

    for (const item of items) {
      const id = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(id) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10
      ) {
        return res.status(400).json({
          message: "Invalid cart item."
        });
      }

      const totalQuantity = (quantities.get(id) || 0) + quantity;

      if (totalQuantity > 10) {
        return res.status(400).json({
          message: "Maximum quantity per product is 10."
        });
      }

      quantities.set(id, totalQuantity);
    }

    // Get current product prices from database
    let totalPaise = 0;
    const orderItems = [];

    for (const [productId, quantity] of quantities) {
      const product = await Product.findOne({
        _id: productId,
        active: true
      });

      if (!product || product.stock < quantity) {
        return res.status(409).json({
          message: "Product unavailable or insufficient stock."
        });
      }

      totalPaise += Math.round(product.price * 100) * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    if (totalPaise < 100) {
      return res.status(400).json({
        message: "Minimum order amount is ₹1."
      });
    }

    // Determine order status
    const status =
      paymentMethod === "cod"
        ? "created"
        : mockOutcome === "success"
        ? "paid"
        : "failed";

    // Reserve stock for COD and successful mock payments.
    // Failed mock payments do not reduce stock.
    if (status !== "failed") {
      for (const item of orderItems) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: item.product,
            active: true,
            stock: { $gte: item.quantity }
          },
          {
            $inc: { stock: -item.quantity }
          },
          { new: true }
        );

        if (!updated) {
          // Restore stock reserved earlier in this request
          for (const r of reserved) {
            await Product.updateOne(
              { _id: r.productId },
              { $inc: { stock: r.quantity } }
            );
          }

          reserved.length = 0;

          return res.status(409).json({
            message: "Stock changed. Please refresh your cart."
          });
        }

        reserved.push({
          productId: item.product,
          quantity: item.quantity
        });
      }
    }

    // Save order in MongoDB
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      amountPaise: totalPaise,
      paymentMethod,
      status,
      shippingAddress
    });

    res.status(201).json({
      message:
        paymentMethod === "cod"
          ? "COD order placed successfully."
          : status === "paid"
          ? "Mock payment successful. Order confirmed."
          : "Mock payment failed.",
      order
    });

  } catch (e) {
    // Restore stock if order creation fails
    for (const r of reserved) {
      await Product.updateOne(
        { _id: r.productId },
        { $inc: { stock: r.quantity } }
      );
    }

    next(e);
  }
});
app.get("/api/orders/mine",auth,async(req,res,next)=>{try{res.json({orders:await Order.find({user:req.user.id}).sort({createdAt:-1})})}catch(e){next(e)}});
app.get("/api/admin/orders",auth,admin,async(_,res,next)=>{try{res.json({orders:await Order.find().populate("user","name email").sort({createdAt:-1}).limit(200)})}catch(e){next(e)}});
app.post("/api/payments/create-order",auth,async(req,res,next)=>{try{if(!Array.isArray(req.body.items)||!req.body.items.length||req.body.items.length>50)return res.status(400).json({message:"Invalid cart"});let total=0,items=[];for(const x of req.body.items){if(!mongoose.isValidObjectId(x.productId)||!Number.isInteger(Number(x.quantity))||x.quantity<1||x.quantity>10)return res.status(400).json({message:"Invalid item"});const p=await Product.findOne({_id:x.productId,active:true});if(!p||p.stock<x.quantity)return res.status(400).json({message:"Product unavailable or insufficient stock"});total+=Math.round(p.price*100)*x.quantity;items.push({product:p._id,name:p.name,price:p.price,quantity:x.quantity})}if(total<100)return res.status(400).json({message:"Minimum order is ₹1"});const r=await rp().orders.create({amount:total,currency:"INR",receipt:"sm_"+Date.now()});const o=await Order.create({user:req.user.id,items,amountPaise:total,razorpayOrderId:r.id});res.status(201).json({keyId:process.env.RAZORPAY_KEY_ID,orderId:r.id,amount:r.amount,currency:r.currency,sanmartOrderId:o._id})}catch(e){next(e)}});
app.post("/api/payments/verify",auth,async(req,res,next)=>{try{const {razorpay_order_id,razorpay_payment_id,razorpay_signature,sanmartOrderId}=req.body,o=await Order.findOne({_id:sanmartOrderId,user:req.user.id});if(!o||o.razorpayOrderId!==razorpay_order_id)return res.status(400).json({message:"Order could not be verified"});const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex"),a=Buffer.from(expected),b=Buffer.from(String(razorpay_signature||""));if(a.length!==b.length||!crypto.timingSafeEqual(a,b)){o.status="failed";await o.save();return res.status(400).json({message:"Payment verification failed"})}if(o.status!=="paid"){for(const i of o.items){const result=await Product.updateOne({_id:i.product,stock:{$gte:i.quantity}},{$inc:{stock:-i.quantity}});if(!result.modifiedCount)return res.status(409).json({message:"Payment received but stock changed; contact support"})}o.status="paid";o.razorpayPaymentId=razorpay_payment_id;await o.save()}res.json({message:"Payment verified",orderId:o._id})}catch(e){next(e)}});
async function seed(){if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD&&!await User.findOne({email:process.env.ADMIN_EMAIL.toLowerCase()})){await User.create({name:process.env.ADMIN_NAME||"SANMART Admin",email:process.env.ADMIN_EMAIL,passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:"admin"});console.log("Created admin account from .env")}if(!await Product.countDocuments())await Product.insertMany([{name:"Wireless Headphones",category:"Electronics",price:1499,stock:20,image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",description:"Everyday wireless audio."},{name:"Smart Watch",category:"Electronics",price:2299,stock:15,image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",description:"A modern everyday watch."},{name:"Everyday Backpack",category:"Fashion",price:999,stock:25,image:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",description:"A roomy backpack for work or study."},{name:"Coffee Mug Set",category:"Home",price:499,stock:30,image:"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",description:"Simple ceramic mugs."}])}
app.use((e,req,res,next)=>{console.error(e);if(e.code===11000)return res.status(409).json({message:"Email already exists"});res.status(e.name==="ValidationError"||e.name==="CastError"?400:500).json({message:e.message||"Server error"})});
if(!SECRET||SECRET.length<24)console.warn("Set a JWT_SECRET at least 24 characters in .env");
mongoose.connect(process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/sanmart").then(async()=>{console.log("MongoDB connected");await seed();app.listen(PORT,()=>console.log(`API: http://localhost:${PORT}`))}).catch(e=>{console.error("MongoDB connection failed:",e.message);process.exit(1)});