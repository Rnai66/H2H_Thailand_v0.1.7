// node backend/src/scripts/seedItems.js
import "dotenv/config.js";
import mongoose from "mongoose";
import { getConn } from "../config/db.js";
import { getItemModel } from "../models/Item.js";

async function main() {
  try {
    const conn = await getConn("item_db");           // ✅ ใช้คอนเนกชัน item_db เดิม
    const Item = getItemModel(conn);                 // ✅ ดึงโมเดลผ่านฟังก์ชันเดียวกัน

    // ปรับตามต้องการ
    const docs = [
      {
        title: "H2H BroCoin T-Shirt",
        description: "Digital Silk limited",
        price: 390,
        status: "active",
        images: ["https://example.com/tshirt.jpg"],
        // sellerId: "6900b356b1176cdd16d5bd13", // (ถ้าจะผูกกับ admin ที่มีอยู่จริง)
      },
      {
        title: "H2H Gold Mug",
        description: "Gold/Blue edition",
        price: 250,
        status: "inactive",
        images: ["https://example.com/mug.jpg"],
      },
      {
        title: "Digital Silk Notebook",
        description: "A5 lined",
        price: 199,
        status: "active",
        images: ["https://example.com/notebook.jpg"],
      },
    ];

    // เคลียร์ของเก่าก่อน (ถ้าไม่อยากลบ ให้คอมเมนต์ทิ้ง)
    await Item.deleteMany({});

    const result = await Item.insertMany(docs, { ordered: false });
    console.log(`✅ Seeded items: ${result.length}`);

  } catch (e) {
    console.error("❌ seed items error:", e);
    process.exitCode = 1;
  } finally {
    // ปิดทุกคอนเนกชัน mongoose ให้เรียบร้อย
    const conns = mongoose.connections || [];
    await Promise.allSettled(conns.map((c) => c.close()));
  }
}

main();
