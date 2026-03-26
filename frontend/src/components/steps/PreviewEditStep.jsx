export function PreviewEditStep({ hint, subject, body, onSubjectChange, onBodyChange, onBack, onNext }) {
  return (
    <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Preview & edit</h2>
        <p className="text-sm text-black/50">{hint}</p>
      </div>
      <label className="block text-sm font-medium">
        Subject
        <input
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Body
        <textarea
          rows={12}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 font-sans text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
        />
      </label>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
          Back
        </button>
        <button type="button" onClick={onNext} className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white">
          Next
        </button>
      </div>
    </div>
  );
}
