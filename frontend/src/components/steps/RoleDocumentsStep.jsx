export function RoleDocumentsStep({
  hint,
  positionTitle,
  resumeFile,
  jdFile,
  onPositionTitleChange,
  onResumeFileChange,
  onJdFileChange,
  onBack,
  onNext,
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Role & documents</h2>
        <p className="text-sm text-black/50">{hint}</p>
      </div>
      <label className="block text-sm font-medium">
        Position title
        <input
          required
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={positionTitle}
          onChange={(e) => onPositionTitleChange(e.target.value)}
          placeholder="e.g. Senior Product Designer"
        />
      </label>
      <label className="block text-sm font-medium">
        Resume (PDF)
        <input
          type="file"
          accept="application/pdf"
          className="mt-1 w-full text-sm"
          onChange={(e) => onResumeFileChange(e.target.files?.[0] || null)}
        />
      </label>
      <label className="block text-sm font-medium">
        Job description (PDF)
        <input
          type="file"
          accept="application/pdf"
          className="mt-1 w-full text-sm"
          onChange={(e) => onJdFileChange(e.target.files?.[0] || null)}
        />
      </label>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!positionTitle || !resumeFile || !jdFile}
          className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
