import { GoogleGenerativeAI } from "@google/generative-ai";

// 1.5 IDs often 404 on v1beta; use a current stable id (override via GEMINI_MODEL).
const DEFAULT_MODEL = "gemini-2.5-flash";

function buildPrompt({
  senderName,
  senderEmail,
  phone,
  positionTitle,
  companyName,
  wordLimit,
  jdText,
  resumeText,
}) {
  return `You are helping write a concise, professional cold outreach email for a job application.

Sender:
- Name: ${senderName}
- Email: ${senderEmail}
- Phone: ${phone || "not provided"}

Target role: ${positionTitle}
Target company: ${companyName || "(not provided)"}
Required body word limit: ${wordLimit} words

Job description (may be excerpt):
"""
${jdText || "(not provided)"}
"""

Resume / background (may be excerpt):
"""
${resumeText || "(not provided)"}
"""

Write:
1) A short subject line (no quotes).
2) The email body in plain text, personalized, no fluff, one clear call-to-action.
   The body must be very close to ${wordLimit} words (acceptable range: ${Math.max(80, wordLimit - 10)}-${wordLimit + 10}).
   Important: Do NOT hard-wrap lines at a fixed width. Each paragraph should be one or more full sentences on continuous lines. Use a blank line ONLY between paragraphs (greeting, paragraphs, closing).

Respond in JSON only with this exact shape:
{"subject":"...","body":"..."}`;
}

export async function generateColdEmail({
  apiKey,
  senderName,
  senderEmail,
  phone,
  positionTitle,
  companyName,
  wordLimit,
  jdPdfBuffer,
  resumePdfBuffer,
  jdTextFallback,
  resumeTextFallback,
}) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const parts = [];

  let jdText = jdTextFallback || "";
  let resumeText = resumeTextFallback || "";

  if (jdPdfBuffer?.length) {
    parts.push({
      inlineData: { mimeType: "application/pdf", data: jdPdfBuffer.toString("base64") },
    });
    parts.push({ text: "The PDF above is the job description. Extract relevant requirements for the email." });
  }

  if (resumePdfBuffer?.length) {
    parts.push({
      inlineData: { mimeType: "application/pdf", data: resumePdfBuffer.toString("base64") },
    });
    parts.push({ text: "The PDF above is the candidate resume. Use it for tone and achievements." });
  }

  parts.push({
    text: buildPrompt({
      senderName,
      senderEmail,
      phone,
      positionTitle,
      companyName,
      wordLimit: Number(wordLimit) || 180,
      jdText,
      resumeText,
    }),
  });

  const result = await model.generateContent({ contents: [{ role: "user", parts }] });
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Model did not return JSON: " + text.slice(0, 400));
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.subject || !parsed.body) {
    throw new Error("Invalid JSON shape from model");
  }
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}
