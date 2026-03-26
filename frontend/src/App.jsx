import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMe,
  generateEmail,
  getGoogleAuthUrl,
  registerUser,
  sendEmails,
} from "./api.js";

const STEPS = [
  { id: 1, title: "Your info", hint: "Name, email, phone" },
  { id: 2, title: "Position", hint: "JD + resume (PDFs)" },
  { id: 3, title: "Generate", hint: "AI drafts the email" },
  { id: 4, title: "Preview & edit", hint: "Tweak subject and body" },
  { id: 5, title: "Recipients", hint: "Who to email" },
  { id: 6, title: "Authenticate", hint: "Connect Gmail" },
  { id: 7, title: "Send", hint: "Dispatch" },
];

const TOKEN_KEY = "coldemail_token";
const WIZARD_KEY = "coldemail_wizard";

function LegalPage({ title, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-mist to-[#e8e4dc] text-ink">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <a href="/" className="text-sm text-black/50 underline">
          Back to app
        </a>
        <h1 className="mt-4 font-display text-4xl italic sm:text-5xl">{title}</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-black/5 bg-surface p-6 text-sm leading-7 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}

function PrivacyPolicyPage() {
  const d = "March 26, 2026";
  return (
    <LegalPage title="Privacy Policy">
      <p>Effective date: {d}</p>
      <p>
        Cold Email Generator helps users draft and send outreach emails using user-provided
        documents and Gmail OAuth.
      </p>
      <p>
        Data we process: profile fields (name, email, phone), uploaded resume/job description PDFs,
        generated email drafts, recipient addresses, and OAuth tokens required for Gmail sending.
      </p>
      <p>
        Purpose: generate email content, let users edit drafts, and send emails on user instruction.
      </p>
      <p>
        Third parties: Google (OAuth/Gmail API), Google Gemini API for generation, MongoDB Atlas for
        app data hosting, and cloud hosting providers used to run this app.
      </p>
      <p>
        Retention: data is kept only as needed to provide features and maintain send history. Users
        can request deletion by contacting the developer email on the consent screen.
      </p>
      <p>
        Security: tokens and API keys are stored server-side and should never be exposed to clients.
        No method of transmission or storage is perfectly secure.
      </p>
      <p>
        This app is intended for lawful outreach only. Do not use it for spam, abuse, or illegal
        activity.
      </p>
    </LegalPage>
  );
}

function TermsPage() {
  const d = "March 26, 2026";
  return (
    <LegalPage title="Terms of Service">
      <p>Effective date: {d}</p>
      <p>
        By using Cold Email Generator, you agree to use the service responsibly and in compliance
        with applicable laws, email policies, and platform terms (including Google APIs terms).
      </p>
      <p>
        You are responsible for the content you generate and send, including recipient consent and
        anti-spam compliance in your jurisdiction.
      </p>
      <p>
        The service is provided on an "as is" basis without warranties of accuracy, deliverability,
        or fitness for a particular purpose.
      </p>
      <p>
        We may limit or suspend access for misuse, abuse, or security risks.
      </p>
      <p>
        Liability is limited to the maximum extent permitted by law. You agree to indemnify the
        service operator against claims arising from your misuse of the service.
      </p>
      <p>
        Terms may be updated from time to time. Continued use after updates means acceptance of the
        revised terms.
      </p>
    </LegalPage>
  );
}

function readWizardFromStorage(token) {
  try {
    const raw = sessionStorage.getItem(WIZARD_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!token || w.token !== token) return null;
    return w;
  } catch {
    return null;
  }
}

function getInitialWizardState() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const gmailReturn =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("gmail") === "connected";
  const w = readWizardFromStorage(token);
  if (!w) {
    return {
      step: 1,
      gmailConnected: false,
      name: "",
      email: "",
      phone: "",
      positionTitle: "",
      subject: "",
      body: "",
      recipientsRaw: "",
      attachResume: true,
    };
  }
  return {
    step: gmailReturn ? 7 : w.step ?? 1,
    gmailConnected: gmailReturn,
    name: w.name ?? "",
    email: w.email ?? "",
    phone: w.phone ?? "",
    positionTitle: w.positionTitle ?? "",
    subject: w.subject ?? "",
    body: w.body ?? "",
    recipientsRaw: w.recipientsRaw ?? "",
    attachResume: w.attachResume !== false,
  };
}

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsPage />;

  const initial = getInitialWizardState();
  const [step, setStep] = useState(initial.step);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(initial.gmailConnected);

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);

  const [positionTitle, setPositionTitle] = useState(initial.positionTitle);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);

  const [recipientsRaw, setRecipientsRaw] = useState(initial.recipientsRaw);

  const [attachResume, setAttachResume] = useState(initial.attachResume ?? true);
  const [resumeAttachmentOverride, setResumeAttachmentOverride] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendProgress, setSendProgress] = useState(null);

  const recipients = useMemo(
    () =>
      recipientsRaw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [recipientsRaw]
  );

  const persistToken = useCallback((t) => {
    setToken(t);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const payload = {
      token,
      step,
      name,
      email,
      phone,
      positionTitle,
      subject,
      body,
      recipientsRaw,
      attachResume,
    };
    sessionStorage.setItem(WIZARD_KEY, JSON.stringify(payload));
  }, [token, step, name, email, phone, positionTitle, subject, body, recipientsRaw, attachResume]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMe(token);
        if (cancelled) return;
        setUser(data.user);
        setGmailConnected(data.gmailConnected);
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setPhone(data.user.phone || "");
      } catch {
        persistToken("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, persistToken]);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await registerUser({ email, name, phone });
      persistToken(data.token);
      setUser(data.user);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!resumeFile || !jdFile) {
      setError("Upload both resume and job description PDFs.");
      return;
    }
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.append("senderName", name);
    fd.append("senderEmail", email);
    fd.append("phone", phone);
    fd.append("positionTitle", positionTitle);
    fd.append("resume", resumeFile);
    fd.append("jobDescription", jdFile);
    try {
      const out = await generateEmail(token, fd);
      setSubject(out.subject);
      setBody(out.body);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectGmail() {
    setError("");
    try {
      const url = await getGoogleAuthUrl(token);
      sessionStorage.setItem(
        WIZARD_KEY,
        JSON.stringify({
          token,
          step,
          name,
          email,
          phone,
          positionTitle,
          subject,
          body,
          recipientsRaw,
          attachResume,
        })
      );
      window.location.href = url;
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSend() {
    setError("");
    if (recipients.length === 0) {
      setError("Add at least one recipient email.");
      return;
    }
    const resumeForSend = resumeAttachmentOverride || resumeFile;
    if (attachResume && !resumeForSend) {
      setError("Turn off “Attach resume” or choose a PDF (from step 2 or below).");
      return;
    }
    setLoading(true);
    setSendProgress("Sending…");
    try {
      const result = await sendEmails(token, {
        subject,
        body,
        recipients,
        positionTitle,
        resumeFile: attachResume ? resumeForSend : undefined,
      });
      const failed = result.results?.filter((r) => !r.ok) || [];
      setSendProgress(
        failed.length
          ? `Sent with ${failed.length} failure(s). Check API response.`
          : "All sent."
      );
      if (!failed.length) {
        sessionStorage.removeItem(WIZARD_KEY);
      }
    } catch (err) {
      setError(err.message);
      setSendProgress(null);
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-mist to-[#e8e4dc]">
      <header className="border-b border-black/5 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
            Outreach
          </p>
          <h1 className="font-display text-4xl italic text-ink sm:text-5xl">
            Cold email generator
          </h1>
          <p className="max-w-xl text-sm text-black/60">
            React SPA → Express API → MongoDB Atlas. Gemini drafts the message; Gmail sends it after
            OAuth.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ol className="mb-10 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => token && s.id <= step && setStep(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  s.id === step
                    ? "bg-ink text-white"
                    : s.id < step
                      ? "bg-black/10 text-ink"
                      : "bg-black/5 text-black/35"
                }`}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {step === 1 && (
          <form
            onSubmit={handleRegister}
            className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm"
          >
            <div>
              <h2 className="font-display text-2xl text-ink">Your profile</h2>
              <p className="text-sm text-black/50">{STEPS[0].hint}</p>
            </div>
            <label className="block text-sm font-medium">
              Full name
              <input
                required
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Role & documents</h2>
              <p className="text-sm text-black/50">{STEPS[1].hint}</p>
            </div>
            <label className="block text-sm font-medium">
              Position title
              <input
                required
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="e.g. Senior Product Designer"
              />
            </label>
            <label className="block text-sm font-medium">
              Resume (PDF)
              <input
                type="file"
                accept="application/pdf"
                className="mt-1 w-full text-sm"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </label>
            <label className="block text-sm font-medium">
              Job description (PDF)
              <input
                type="file"
                accept="application/pdf"
                className="mt-1 w-full text-sm"
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!positionTitle || !resumeFile || !jdFile}
                className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Generate draft</h2>
              <p className="text-sm text-black/50">Calls Gemini with your PDFs (server-side).</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Generating…" : "Run AI generation"}
            </button>
            <button type="button" onClick={() => setStep(2)} className="text-sm text-black/50 underline">
              Back to uploads
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Preview & edit</h2>
              <p className="text-sm text-black/50">{STEPS[3].hint}</p>
            </div>
            <label className="block text-sm font-medium">
              Subject
              <input
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Body
              <textarea
                rows={12}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-sans text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Recipients</h2>
              <p className="text-sm text-black/50">One per line or comma-separated.</p>
            </div>
            <textarea
              rows={6}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-mono text-sm outline-none ring-accent/30 focus:ring-2"
              placeholder="hiring@company.com&#10;recruiter@agency.com"
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
            />
            <p className="text-xs text-black/45">
              Parsed: {recipients.length} address{recipients.length === 1 ? "" : "es"}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Connect Gmail</h2>
              <p className="text-sm text-black/50">
                OAuth opens Google; you are redirected back here with Gmail send permission.
              </p>
            </div>
            {gmailConnected ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Gmail is connected for this account.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmail}
                className="w-full rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold shadow-sm"
              >
                Connect Gmail
              </button>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(5)} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(7)}
                disabled={!gmailConnected}
                className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
            <div>
              <h2 className="font-display text-2xl text-ink">Send</h2>
              <p className="text-sm text-black/50">
                Sends with a short delay between messages to respect Gmail quotas.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={attachResume}
                onChange={(e) => setAttachResume(e.target.checked)}
              />
              <span>
                <span className="font-medium text-ink">Attach resume (PDF)</span>
                <span className="block text-black/50">
                  Same file as step 2 when still in this session, or pick a file below.
                </span>
              </span>
            </label>
            {attachResume && (
              <div className="rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm">
                {resumeFile && (
                  <p className="mb-2 text-black/70">
                    From step 2: <span className="font-mono">{resumeFile.name}</span>
                  </p>
                )}
                <label className="block text-sm font-medium">
                  {resumeFile ? "Or replace with another PDF" : "Choose resume PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="mt-1 w-full text-sm"
                    onChange={(e) => setResumeAttachmentOverride(e.target.files?.[0] || null)}
                  />
                </label>
                {resumeAttachmentOverride && (
                  <p className="mt-2 text-xs text-black/55">
                    Using: {resumeAttachmentOverride.name}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !gmailConnected}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send to all recipients"}
            </button>
            {sendProgress && <p className="text-sm text-black/60">{sendProgress}</p>}
            <button type="button" onClick={() => setStep(6)} className="text-sm text-black/50 underline">
              Back
            </button>
          </div>
        )}

        <footer className="mt-12 border-t border-black/5 pt-6 text-xs text-black/40">
          <div className="flex items-center justify-between gap-3">
            <span>
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <span className="space-x-3">
              <a href="/privacy" className="underline">
                Privacy
              </a>
              <a href="/terms" className="underline">
                Terms
              </a>
            </span>
          </div>
          {user && (
            <span className="ml-2">
              · Signed in as {user.email}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => {
                  sessionStorage.removeItem(WIZARD_KEY);
                  persistToken("");
                  setUser(null);
                  setStep(1);
                }}
              >
                Sign out
              </button>
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}
