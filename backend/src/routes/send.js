import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { uploadOptionalResume } from "../middleware/upload.js";
import { sendToMany } from "../services/gmail.js";

const router = Router();

router.post("/", authRequired, uploadOptionalResume, async (req, res) => {
  let recipients;
  try {
    recipients = JSON.parse(req.body.recipients || "[]");
  } catch {
    return res.status(400).json({ error: "recipients must be a JSON array" });
  }

  const { subject, body, positionTitle } = req.body || {};
  if (!subject || !body || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "subject, body, and recipients[] are required" });
  }

  const attachment = req.file?.buffer?.length
    ? { buffer: req.file.buffer, filename: req.file.originalname || "resume.pdf" }
    : undefined;

  const userId = req.user.sub;
  const oauth = await prisma.oAuthToken.findUnique({ where: { userId } });
  if (!oauth?.refreshToken) {
    return res.status(400).json({ error: "Connect Gmail first" });
  }

  const draft = await prisma.emailDraft.create({
    data: {
      userId,
      positionTitle: positionTitle ? String(positionTitle) : "Application",
      subject: String(subject),
      body: String(body),
    },
  });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const results = await sendToMany({
    refreshToken: oauth.refreshToken,
    recipients: recipients.map((r) => String(r).trim()).filter(Boolean),
    subject: String(subject),
    bodyText: String(body),
    clientId,
    clientSecret,
    redirectUri,
    attachment,
  });

  const logs = await Promise.all(
    results.map((r) =>
      prisma.sendLog.create({
        data: {
          draftId: draft.id,
          recipientEmail: r.email,
          status: r.ok ? "sent" : "failed",
          errorMessage: r.ok ? null : r.error,
          sentAt: r.ok ? new Date() : null,
        },
      })
    )
  );

  res.json({ draftId: draft.id, results, logs });
});

export default router;
