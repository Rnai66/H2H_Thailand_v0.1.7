import mongoose from "mongoose";
export function UserModel(conn) {
  const name = "User";
  if (conn.models[name]) return conn.models[name];
  const schema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true }
  }, { timestamps: true });
  return conn.model(name, schema);
}
