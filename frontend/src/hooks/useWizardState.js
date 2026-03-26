import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY, WIZARD_KEY } from "../constants/constants.js";

function readWizardFromStorage(token) {
  try {
    const raw = sessionStorage.getItem(WIZARD_KEY);
    if (!raw) return null;
    const wizard = JSON.parse(raw);
    if (!token || wizard.token !== token) return null;
    return wizard;
  } catch {
    return null;
  }
}

function getInitialWizardState() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const gmailReturn =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("gmail") === "connected";
  const wizard = readWizardFromStorage(token);

  if (!wizard) {
    return {
      step: 1,
      gmailConnected: false,
      name: "",
      email: "",
      phone: "",
      positionTitle: "",
      companyName: "",
      wordLimit: "180",
      subject: "",
      body: "",
      recipientsRaw: "",
      attachResume: true,
    };
  }

  return {
    step: gmailReturn ? 7 : wizard.step ?? 1,
    gmailConnected: gmailReturn,
    name: wizard.name ?? "",
    email: wizard.email ?? "",
    phone: wizard.phone ?? "",
    positionTitle: wizard.positionTitle ?? "",
    companyName: wizard.companyName ?? "",
    wordLimit: wizard.wordLimit ?? "180",
    subject: wizard.subject ?? "",
    body: wizard.body ?? "",
    recipientsRaw: wizard.recipientsRaw ?? "",
    attachResume: wizard.attachResume !== false,
  };
}

export function useWizardState(token = "") {
  const initial = useMemo(() => getInitialWizardState(), []);

  const [step, setStep] = useState(initial.step);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [positionTitle, setPositionTitle] = useState(initial.positionTitle);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [wordLimit, setWordLimit] = useState(initial.wordLimit);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [recipientsRaw, setRecipientsRaw] = useState(initial.recipientsRaw);
  const [attachResume, setAttachResume] = useState(initial.attachResume ?? true);
  const [resumeAttachmentOverride, setResumeAttachmentOverride] = useState(null);
  const [error, setError] = useState("");
  const [sendProgress, setSendProgress] = useState(null);

  const recipients = useMemo(
    () =>
      recipientsRaw
        .split(/[\n,;]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    [recipientsRaw]
  );

  const createWizardPayload = useCallback(
    (authToken) => ({
      token: authToken,
      step,
      name,
      email,
      phone,
      positionTitle,
      companyName,
      wordLimit,
      subject,
      body,
      recipientsRaw,
      attachResume,
    }),
    [step, name, email, phone, positionTitle, companyName, wordLimit, subject, body, recipientsRaw, attachResume]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    sessionStorage.setItem(WIZARD_KEY, JSON.stringify(createWizardPayload(token)));
  }, [token, createWizardPayload]);

  const clearWizardStorage = useCallback(() => {
    sessionStorage.removeItem(WIZARD_KEY);
  }, []);

  return {
    initialGmailConnected: initial.gmailConnected,
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
    companyName,
    setCompanyName,
    wordLimit,
    setWordLimit,
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
  };
}
