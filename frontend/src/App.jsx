import { useCallback, useEffect, useRef, useState } from "react";
import { PrivacyPolicyPage, TermsPage } from "./components/LegalPages/LegalPages.jsx";
import { WizardFooter } from "./components/WizardFooter/WizardFooter.jsx";
import { WizardProgress } from "./components/WizardProgress/WizardProgress.jsx";
import { AuthenticateStep } from "./components/steps/AuthenticateStep.jsx";
import { GenerateStep } from "./components/steps/GenerateStep.jsx";
import { PreviewEditStep } from "./components/steps/PreviewEditStep.jsx";
import { ProfileStep } from "./components/steps/ProfileStep.jsx";
import { RecipientsStep } from "./components/steps/RecipientsStep.jsx";
import { RoleDocumentsStep } from "./components/steps/RoleDocumentsStep.jsx";
import { SendStep } from "./components/steps/SendStep.jsx";
import { STEPS, WIZARD_KEY } from "./constants/constants.js";
import { useAuth } from "./hooks/useAuth.js";
import { useWizardState } from "./hooks/useWizardState.js";
import { generateEmail, getGoogleAuthUrl, registerUser, sendEmails } from "./services/api.js";

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsPage />;

  const [isRegistering, setIsRegistering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendUiPhase, setSendUiPhase] = useState("idle");
  const redirectTimersRef = useRef([]);
  const wizard = useWizardState();
  const {
    step,
    setStep,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    positionTitle,
    setPositionTitle,
    resumeFile,
    setResumeFile,
    jdFile,
    setJdFile,
    subject,
    setSubject,
    body,
    setBody,
    recipientsRaw,
    setRecipientsRaw,
    recipients,
    attachResume,
    setAttachResume,
    resumeAttachmentOverride,
    setResumeAttachmentOverride,
    error,
    setError,
    sendProgress,
    setSendProgress,
    createWizardPayload,
    clearWizardStorage,
    initialGmailConnected,
  } = wizard;

  const hydrateProfile = useCallback(({ name: userName, email: userEmail, phone: userPhone }) => {
    setName(userName || "");
    setEmail(userEmail || "");
    setPhone(userPhone || "");
  }, [setName, setEmail, setPhone]);

  const { token, user, setUser, gmailConnected, persistToken } = useAuth({
    initialGmailConnected,
    onProfileHydrate: hydrateProfile,
  });

  const clearRedirectTimers = useCallback(() => {
    redirectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    redirectTimersRef.current = [];
  }, []);

  useEffect(() => clearRedirectTimers, [clearRedirectTimers]);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setIsRegistering(true);
    try {
      const data = await registerUser({ email, name, phone });
      persistToken(data.token);
      setUser(data.user);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleGenerate() {
    if (!resumeFile || !jdFile) {
      setError("Upload both resume and job description PDFs.");
      return;
    }
    setError("");
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  }

  async function handleConnectGmail() {
    setError("");
    try {
      const url = await getGoogleAuthUrl(token);
      sessionStorage.setItem(WIZARD_KEY, JSON.stringify(createWizardPayload(token)));
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
    setIsSending(true);
    clearRedirectTimers();
    setSendUiPhase("idle");
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
        setSendUiPhase("success");
        const redirectLoaderTimer = window.setTimeout(() => {
          setSendUiPhase("redirecting");
        }, 1200);
        const redirectStepTimer = window.setTimeout(() => {
          clearWizardStorage();
          setStep(1);
          setSendProgress(null);
          setSendUiPhase("idle");
          redirectTimersRef.current = [];
        }, 2600);
        redirectTimersRef.current = [redirectLoaderTimer, redirectStepTimer];
      }
    } catch (err) {
      setError(err.message);
      setSendProgress(null);
      setSendUiPhase("idle");
    } finally {
      setIsSending(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const onSignOut = useCallback(() => {
    clearWizardStorage();
    persistToken("");
    setUser(null);
    setStep(1);
  }, [clearWizardStorage, persistToken, setStep, setUser]);

  function renderStep() {
    if (step === 1) {
      return (
        <ProfileStep
          hint={STEPS[0].hint}
          name={name}
          email={email}
          phone={phone}
          isSubmitting={isRegistering}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onSubmit={handleRegister}
        />
      );
    }
    if (step === 2) {
      return (
        <RoleDocumentsStep
          hint={STEPS[1].hint}
          positionTitle={positionTitle}
          resumeFile={resumeFile}
          jdFile={jdFile}
          onPositionTitleChange={setPositionTitle}
          onResumeFileChange={setResumeFile}
          onJdFileChange={setJdFile}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      );
    }
    if (step === 3) {
      return (
        <GenerateStep
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          onBackToUploads={() => setStep(2)}
        />
      );
    }
    if (step === 4) {
      return (
        <PreviewEditStep
          hint={STEPS[3].hint}
          subject={subject}
          body={body}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      );
    }
    if (step === 5) {
      return (
        <RecipientsStep
          recipientsRaw={recipientsRaw}
          recipientsCount={recipients.length}
          onRecipientsChange={setRecipientsRaw}
          onBack={() => setStep(4)}
          onNext={() => setStep(6)}
        />
      );
    }
    if (step === 6) {
      return (
        <AuthenticateStep
          gmailConnected={gmailConnected}
          onConnectGmail={handleConnectGmail}
          onBack={() => setStep(5)}
          onNext={() => setStep(7)}
        />
      );
    }
    return (
      <SendStep
        attachResume={attachResume}
        resumeFile={resumeFile}
        resumeAttachmentOverride={resumeAttachmentOverride}
        isSending={isSending}
        sendUiPhase={sendUiPhase}
        gmailConnected={gmailConnected}
        sendProgress={sendProgress}
        onAttachResumeChange={setAttachResume}
        onResumeAttachmentOverrideChange={setResumeAttachmentOverride}
        onSend={handleSend}
        onBack={() => setStep(6)}
      />
    );
  }

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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <WizardProgress steps={STEPS} step={step} token={token} onStepSelect={setStep} />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {renderStep()}

        <WizardFooter
          stepIndex={stepIndex}
          stepsLength={STEPS.length}
          user={user}
          onSignOut={onSignOut}
        />
      </main>
    </div>
  );
}
