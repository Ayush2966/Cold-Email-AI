import { google } from "googleapis";
import { normalizeEmailBody, plainToHtml } from "./emailFormat.js";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function encodeSubject(subject) {
  if (/^[\x20-\x7F]*$/.test(subject)) {
    return subject;
  }
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function wrapBase64(b64) {
  return b64.replace(/(.{76})/g, "$1\r\n").trim();
}

/**
 * multipart/alternative: plain (normalized) + HTML so Gmail renders flowing paragraphs.
 */
function buildAlternativeMime({ plainBody, htmlBody, boundary }) {
  return [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    plainBody.replace(/\r?\n/g, "\r\n"),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody.replace(/\r?\n/g, "\r\n"),
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

function buildRawMessage({ to, subject, bodyText, attachment }) {
  const plain = normalizeEmailBody(bodyText);
  const html = plainToHtml(plain);
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  if (!attachment?.buffer?.length) {
    const lines = [
      `To: ${to}`,
      `Subject: ${encodeSubject(subject)}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      "",
      buildAlternativeMime({ plainBody: plain, htmlBody: html, boundary: altBoundary }),
    ];
    return lines.join("\r\n");
  }

  const mixedBoundary = `mixed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const safeName = String(attachment.filename || "resume.pdf").replace(/[^\w.\- ]/g, "_");

  const inner = buildAlternativeMime({ plainBody: plain, htmlBody: html, boundary: altBoundary });

  const parts = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    inner,
    "",
    `--${mixedBoundary}`,
    "Content-Type: application/pdf",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${safeName}"`,
    "",
    wrapBase64(attachment.buffer.toString("base64")),
    "",
    `--${mixedBoundary}--`,
  ];

  return parts.join("\r\n");
}

function toGmailRaw(rawMessage) {
  return Buffer.from(rawMessage, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailMessage({
  refreshToken,
  to,
  subject,
  bodyText,
  clientId,
  clientSecret,
  redirectUri,
  attachment,
}) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const raw = toGmailRaw(
    buildRawMessage({
      to,
      subject,
      bodyText,
      attachment,
    })
  );

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

export async function sendToMany({
  refreshToken,
  recipients,
  subject,
  bodyText,
  clientId,
  clientSecret,
  redirectUri,
  delayMs = 300,
  attachment,
}) {
  const results = [];
  for (const email of recipients) {
    try {
      await sendGmailMessage({
        refreshToken,
        to: email,
        subject,
        bodyText,
        clientId,
        clientSecret,
        redirectUri,
        attachment,
      });
      results.push({ email, ok: true });
    } catch (err) {
      results.push({ email, ok: false, error: err.message });
    }
    await delay(delayMs);
  }
  return results;
}
