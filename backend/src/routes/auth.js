import { Router } from "express";
import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";
import { signToken, authRequired } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, name, phone } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ error: "email and name are required" });
  }
  const user = await prisma.user.upsert({
    where: { email: String(email).trim() },
    update: { name: String(name).trim(), phone: phone ? String(phone).trim() : null },
    create: {
      email: String(email).trim(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : null,
    },
  });
  const token = signToken({ sub: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
});

router.get("/me", authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const tokenRow = await prisma.oAuthToken.findUnique({ where: { userId: user.id } });
  res.json({
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
    gmailConnected: Boolean(tokenRow?.refreshToken),
  });
});

router.get("/google/url", authRequired, (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    const missing = [
      !clientId && "GOOGLE_CLIENT_ID",
      !clientSecret && "GOOGLE_CLIENT_SECRET",
      !redirectUri && "GOOGLE_REDIRECT_URI",
    ].filter(Boolean);
    return res.status(500).json({
      error: "Google OAuth is not configured",
      missing,
    });
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    state: signToken({ sub: req.user.sub, purpose: "gmail_oauth" }),
  });
  res.json({ url });
});

router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }
  let userId;
  try {
    const jwt = (await import("jsonwebtoken")).default;
    const payload = jwt.verify(state, process.env.JWT_SECRET || "dev-only-change-me");
    if (payload.purpose !== "gmail_oauth" || !payload.sub) {
      return res.status(400).send("Invalid state");
    }
    userId = payload.sub;
  } catch {
    return res.status(400).send("Invalid state token");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(String(code));
  if (!tokens.refresh_token) {
    return res.status(400).send("No refresh token — revoke app access in Google Account and try again.");
  }

  await prisma.oAuthToken.upsert({
    where: { userId },
    update: {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || null,
    },
    create: {
      userId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || null,
    },
  });

  const frontend = process.env.CORS_ORIGIN?.split(",")[0]?.trim() || "http://localhost:5173";
  res.redirect(`${frontend}/?gmail=connected`);
});

export default router;
