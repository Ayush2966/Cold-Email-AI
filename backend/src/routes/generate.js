import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { uploadResumeAndJd } from "../middleware/upload.js";
import { normalizeEmailBody } from "../services/emailFormat.js";
import { generateColdEmail } from "../services/gemini.js";

const router = Router();

router.post("/", authRequired, uploadResumeAndJd, async (req, res) => {
  try {
    const {
      senderName,
      senderEmail,
      phone,
      positionTitle,
      jdText,
      resumeText,
    } = req.body || {};

    if (!senderName || !senderEmail || !positionTitle) {
      return res.status(400).json({
        error: "senderName, senderEmail, and positionTitle are required",
      });
    }

    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jobDescription?.[0];

    if (!resumeFile?.buffer?.length && !resumeText) {
      return res.status(400).json({ error: "Provide a resume PDF or resumeText" });
    }
    if (!jdFile?.buffer?.length && !jdText) {
      return res.status(400).json({ error: "Provide a job description PDF or jdText" });
    }

    const result = await generateColdEmail({
      apiKey: process.env.GEMINI_API_KEY,
      senderName: String(senderName),
      senderEmail: String(senderEmail),
      phone: phone ? String(phone) : "",
      positionTitle: String(positionTitle),
      jdPdfBuffer: jdFile?.buffer,
      resumePdfBuffer: resumeFile?.buffer,
      jdTextFallback: jdText ? String(jdText) : "",
      resumeTextFallback: resumeText ? String(resumeText) : "",
    });

    res.json({
      ...result,
      body: normalizeEmailBody(result.body),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Generation failed" });
  }
});

export default router;
