export function SendStep({
  attachResume,
  resumeFile,
  resumeAttachmentOverride,
  isSending,
  sendUiPhase,
  gmailConnected,
  sendProgress,
  onAttachResumeChange,
  onResumeAttachmentOverrideChange,
  onSend,
  onBack,
}) {
  return (
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
          onChange={(e) => onAttachResumeChange(e.target.checked)}
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
              onChange={(e) => onResumeAttachmentOverrideChange(e.target.files?.[0] || null)}
            />
          </label>
          {resumeAttachmentOverride && (
            <p className="mt-2 text-xs text-black/55">Using: {resumeAttachmentOverride.name}</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onSend}
        disabled={isSending || sendUiPhase !== "idle" || !gmailConnected}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send to all recipients"}
      </button>
      {sendUiPhase === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="flex items-center gap-3">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                ✓
              </span>
            </span>
            <span>Email sent successfully.</span>
          </div>
        </div>
      )}
      {sendUiPhase === "redirecting" && (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
            <span>Redirecting to step 1...</span>
          </div>
        </div>
      )}
      {sendProgress && <p className="text-sm text-black/60">{sendProgress}</p>}
      <button type="button" onClick={onBack} className="text-sm text-black/50 underline">
        Back
      </button>
    </div>
  );
}
