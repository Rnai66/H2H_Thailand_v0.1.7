import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173", // Dev
  "https://h2h-frontend-v0-1-7.vercel.app", // Production
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
