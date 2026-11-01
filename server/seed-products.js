
import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "./models.js";

const fashion = [
  ["Men Casual T-Shirt", 599, 30, "photo-1521572163474-6864f9cf17ab", "Comfortable everyday cotton T-shirt."],
  ["Men Formal Shirt", 899, 20, "photo-1603252109303-2751441dd157", "Smart formal shirt for office wear."],
  ["Men Slim Fit Jeans", 1299, 25, "photo-1542272604-787c3835535d", "Stylish slim fit denim jeans."],
  ["Men Hoodie", 1199, 18, "photo-1556821840-3a63f95609a7", "Soft casual hoodie."],
  ["Men Sports Jacket", 1799, 12, "photo-1551028719-00167b16eac5", "Lightweight sports jacket."],
  ["Women Floral Dress", 1499, 20, "photo-1515372039744-b8f02a3ae446", "Beautiful floral everyday dress."],
  ["Women Casual Top", 699, 25, "photo-1503342217505-b0a15ec3261c", "Trendy casual top."],
  ["Women Denim Jeans", 1199, 20, "photo-1541099649105-f69ad21f3246", "Comfortable denim jeans."],
  ["Women Kurti", 999, 30, "photo-1583391733956-6c78276477e8", "Elegant daily wear kurti."],
  ["Women Handbag", 1599, 15, "photo-1584917865442-de89df76afd3", "Stylish everyday handbag."],
  ["Women Sneakers", 1299, 20, "photo-1542291026-7eec264c27ff", "Comfortable casual sneakers."],
  ["Kids Cotton T-Shirt", 399, 30, "photo-1503919005314-30d93d07d823", "Soft cotton T-shirt for kids."],
  ["Kids Casual Shorts", 349, 25, "photo-1503919005314-30d93d07d823", "Comfortable kids shorts."],
  ["Kids Party Dress", 899, 12, "photo-1519238263530-99bdd11df2ea", "Cute party dress for kids."],
  ["Kids Sneakers", 799, 18, "photo-1514989940723-e8e51635b782", "Lightweight kids footwear."],
  ["Men Running Shoes", 1499, 20, "photo-1542291026-7eec264c27ff", "Lightweight running shoes."],
  ["Women Sandals", 699, 22, "photo-1543163521-1bf539c55dd2", "Comfortable casual sandals."],
  ["Classic Wrist Watch", 999, 15, "photo-1523275335684-37898b6baf30", "Classic everyday wrist watch."],
  ["Leather Wallet", 499, 25, "photo-1627123424574-724758594e93", "Compact everyday wallet."],
  ["Fashion Sunglasses", 599, 30, "photo-1511499767150-a48a237f0083", "Stylish UV protection sunglasses."],
  ["Travel Backpack", 999, 20, "photo-1553062407-98eeb64c6a62", "Spacious travel backpack."],
  ["Cotton Socks Pack", 199, 40, "photo-1586350977771-b3b0abd50c82", "Comfortable cotton socks."],
  ["Baseball Cap", 299, 25, "photo-1588850561407-ed78c282e89b", "Adjustable casual cap."],
  ["Women Scarf", 399, 20, "photo-1601924994987-69e26d50dc26", "Soft fashion scarf."],
  ["Leather Belt", 449, 20, "photo-1624222247344-550fb8c7b7f8", "Classic adjustable belt."]
].map(([name, price, stock, photo, description]) => ({
  name,
  description,
  category: "Fashion",
  price,
  stock,
  image: `https://images.unsplash.com/${photo}?w=800&auto=format&fit=crop&q=80`,
  active: true
}));

const electronics = [
  ["Wireless Bluetooth Headphones", 1499, 25, "photo-1505740420928-5e560c06d30e", "Wireless headphones with clear sound."],
  ["Smart Watch Pro", 2299, 20, "photo-1523275335684-37898b6baf30", "Modern smartwatch for everyday use."],
  ["Bluetooth Speaker", 1199, 18, "photo-1608043152269-423dbba4e7e1", "Portable wireless Bluetooth speaker."],
  ["Wireless Earbuds", 999, 30, "photo-1590658268037-6bf12165a8df", "Compact wireless audio earbuds."],
  ["Gaming Mouse", 799, 25, "photo-1527814050087-3793815479db", "Responsive gaming mouse."],
  ["Mechanical Keyboard", 1899, 12, "photo-1587829741301-dc798b83add3", "Mechanical keyboard for typing and gaming."],
  ["Laptop Stand", 699, 20, "photo-1527864550417-7fd91fc51a46", "Adjustable laptop stand."],
  ["HD Webcam", 1299, 15, "photo-1587826080692-f439cd0b70da", "Webcam for online meetings."],
  ["USB-C Hub", 899, 25, "photo-1625842268584-8f3296236761", "Multiport USB-C adapter."],
  ["Power Bank 20000mAh", 1599, 20, "photo-1609091839311-d5365f9ff1c5", "Portable power bank."],
  ["Fast Charging Adapter", 499, 35, "photo-1583863788434-e58a36330cf0", "Fast charging wall adapter."],
  ["USB-C Cable", 199, 50, "photo-1558618666-fcd25c85cd64", "Durable charging cable."],
  ["Smartphone Tripod", 599, 20, "photo-1606983340126-99ab4feaa64a", "Adjustable smartphone tripod."],
  ["DSLR Camera Bag", 1199, 15, "photo-1552168324-d612d77725e3", "Protective camera carrying bag."],
  ["LED Desk Lamp", 899, 20, "photo-1507473885765-e6ed057f782c", "Modern LED study desk lamp."],
  ["WiFi Router", 1799, 12, "photo-1544197150-b99a580bb7a8", "Wireless home networking router."],
  ["External SSD 500GB", 3499, 10, "photo-1597872200969-2b65d56bd16b", "Portable solid state storage."],
  ["Wireless Charger", 799, 20, "photo-1698314440014-3badb1e9c938", "Convenient wireless charging pad."],
  ["Gaming Headset", 1699, 15, "photo-1599669454699-248893623440", "Comfortable gaming headset."],
  ["Portable Projector", 4999, 8, "photo-1478720568477-152d9b164e26", "Compact home entertainment projector."],
  ["Electric Trimmer", 999, 20, "photo-1621607512214-68297480165e", "Rechargeable grooming trimmer."],
  ["Smart LED Bulb", 399, 30, "photo-1507473885765-e6ed057f782c", "Energy-efficient smart LED bulb."],
  ["Digital Alarm Clock", 599, 20, "photo-1508057198894-247b23fe5ade", "Simple digital alarm clock."],
  ["Fitness Band", 1499, 18, "photo-1575311373937-040b8e1fd5b6", "Fitness tracking wrist band."],
  ["Mini USB Fan", 349, 25, "photo-1507473885765-e6ed057f782c", "Compact USB powered desk fan."]
].map(([name, price, stock, photo, description]) => ({
  name,
  description,
  category: "Electronics",
  price,
  stock,
  image: `https://images.unsplash.com/${photo}?w=800&auto=format&fit=crop&q=80`,
  active: true
}));

async function seedProducts() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sanmart"
    );

    console.log("MongoDB connected");

    const products = [...fashion, ...electronics];

    const operations = products.map(product => ({
      updateOne: {
        filter: {
          name: product.name,
          category: product.category
        },
        update: {
          $setOnInsert: product
        },
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(operations);

    console.log("Fashion products:", fashion.length);
    console.log("Electronics products:", electronics.length);
    console.log("New products inserted:", result.upsertedCount);
    console.log("Already existing products skipped:", result.matchedCount);
    console.log("Total products in database:", await Product.countDocuments());

  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
