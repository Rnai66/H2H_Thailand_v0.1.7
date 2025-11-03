import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["active", "sold", "inactive"], default: "active" },
  sellerId: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

itemSchema.index({ title: "text", description: "text" });
itemSchema.index({ createdAt: -1 });

export default mongoose.model("Item", itemSchema);
