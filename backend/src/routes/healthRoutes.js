import { Router } from "express";
import { DBNAMES } from "../config/dbPool.js";
const router = Router();
router.get("/", (_req, res) => res.json({ status: "ok", service: "h2h-backend", dbs: DBNAMES, ts: Date.now() }));
export default router;
