import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ["active","inactive","sold"], default: "active" },
    images: [{ type: String }],
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "items" }
);

// ผูกโมเดลกับ connection ที่ส่งเข้ามา
export function getItemModel(conn) {
  return conn.models.Item || conn.model("Item", ItemSchema);
}
