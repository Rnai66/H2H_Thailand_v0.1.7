// backend/src/models/Item.js
import mongoose from "mongoose";

let compiled = new WeakMap();

export function getItemModel(conn) {
  if (compiled.has(conn)) return compiled.get(conn);

  const ItemSchema = new mongoose.Schema(
    {
      title: { type: String, required: true, index: true },
      price: { type: Number, required: true, min: 0 },
      description: { type: String, default: "" },
      images: [{ type: String }],
      sellerId: { type: String, index: true },
      status: { type: String, enum: ["active", "sold", "inactive"], default: "active", index: true },
      isDeleted: { type: Boolean, default: false, index: true },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

  ItemSchema.index({ title: "text", description: "text" });

  const Model = conn.model("Item", ItemSchema);
  compiled.set(conn, Model);
  return Model;
}
