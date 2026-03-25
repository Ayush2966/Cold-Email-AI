import "./env.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import generateRoutes from "./routes/generate.js";
import sendRoutes from "./routes/send.js";
import historyRoutes from "./routes/history.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/send", sendRoutes);
app.use("/api/history", historyRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 10 MB)" });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message || "Upload error" });
  }
  res.status(500).json({ error: err.message || "Server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
