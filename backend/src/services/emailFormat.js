/**
 * LLMs often insert hard line breaks mid-sentence. Collapse those to spaces;
 * keep blank lines as paragraph breaks.
 */
export function normalizeEmailBody(text) {
  if (!text) return "";
  const t = String(text).replace(/\r\n/g, "\n").trim();
  if (!t) return "";
  return t
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML version so Gmail flows text instead of honoring every newline. */
export function plainToHtml(normalizedPlain) {
  const paras = normalizedPlain
    .split(/\n\n/)
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;line-height:1.6;">${escapeHtml(p)}</p>`
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;">${paras}</body></html>`;
}
