const apiBase = import.meta.env.VITE_API_URL ?? "";

function authHeaders(token) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registerUser({ email, name, phone }) {
  const res = await fetch(`${apiBase}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Register failed");
  return data;
}

export async function fetchMe(token) {
  const res = await fetch(`${apiBase}/api/auth/me`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Session invalid");
  return data;
}

export async function getGoogleAuthUrl(token) {
  const res = await fetch(`${apiBase}/api/auth/google/url`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not start Google OAuth");
  return data.url;
}

export async function generateEmail(token, formData) {
  const res = await fetch(`${apiBase}/api/generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Generation failed");
  return data;
}

export async function sendEmails(token, { subject, body, recipients, positionTitle, resumeFile }) {
  const fd = new FormData();
  fd.append("subject", subject);
  fd.append("body", body);
  fd.append("positionTitle", positionTitle ?? "");
  fd.append("recipients", JSON.stringify(recipients));
  if (resumeFile) {
    fd.append("resume", resumeFile);
  }
  const res = await fetch(`${apiBase}/api/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Send failed");
  return data;
}

export async function fetchHistory(token) {
  const res = await fetch(`${apiBase}/api/history`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "History failed");
  return data;
}
