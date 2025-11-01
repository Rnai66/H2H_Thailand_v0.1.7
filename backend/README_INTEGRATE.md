# Integrate Pack — Backend (Orders + Payments mock + Infra)

## Files Included
- `src/config/db.js` — Mongoose connect with retry
- `src/utils/logger.js` — pino logger
- `src/middleware/errorHandler.js` — 404 + error handler
- `src/middleware/cors.js` — CORS (uses `CORS_ORIGIN`)
- `src/routes/healthRoutes.js` — `GET /api/health`
- `src/server.example.js` — Example Express server wiring
- `scripts/seed.js` — Seed sample users + listings (uses User/Listing example models)
- `src/models/User.example.js`, `src/models/Listing.example.js` — Example models for seed
- `.env.example` — Base environment

## How to Merge
1) คัดลอกไฟล์เข้าโปรเจกต์ของคุณ (จัดวางตาม `src/...`)
2) หากมีโมเดล User/Listing อยู่แล้ว:
   - ลบไฟล์ `User.example.js` และ `Listing.example.js`
   - ปรับ import ใน `scripts/seed.js` ให้ชี้ไปโมเดลจริง
3) เปิดไฟล์ server หลัก เพิ่มการเชื่อมต่อ DB และ routes:
```js
import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
import { corsMiddleware } from "./src/middleware/cors.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import healthRoutes from "./src/routes/healthRoutes.js";

app.use(corsMiddleware());
app.use("/api/health", healthRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
await connectDB(process.env.MONGO_URI);
app.listen(PORT, () => console.log("Server on", PORT));
```
4) ตั้งค่า ENV จาก `.env.example` บนเครื่อง/บน Railway
5) รันทดสอบ:
```bash
node scripts/seed.js
npm start     # หรือ node index.js/server.js
curl http://localhost:4000/api/health
```

## Package Scripts (suggestion)
เพิ่มใน `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon src/server.example.js",
    "start": "node src/server.example.js",
    "seed": "node scripts/seed.js"
  }
}
```

## Railway Notes
- แอปต้องอ่าน `process.env.PORT`
- ตั้ง `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `LOG_LEVEL`
- Healthcheck ที่ `/api/health`
