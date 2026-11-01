import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "./models.js";

const updates = [
  {
    name: "Women Kurti",
    image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800"
  },
  {
    name: "Leather Belt",
    image: "https://images.unsplash.com/photo-1626508651395-474256aba3ad?auto=format&fit=crop&w=800"
  },
{
  name: "Wireless Charger",
  image: "https://images.unsplash.com/photo-1626508651395-474256aba3ad?auto=format&fit=crop&w=800"
}
];

async function fixImages() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sanmart"
    );

    for (const item of updates) {
      const result = await Product.updateOne(
        { name: item.name },
        { $set: { image: item.image } }
      );

      console.log(
        `${item.name}: ${result.matchedCount ? "Updated" : "Product not found"}`
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

fixImages();
