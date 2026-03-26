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

export function PrivacyPolicyPage() {
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

export function TermsPage() {
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
      <p>We may limit or suspend access for misuse, abuse, or security risks.</p>
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
