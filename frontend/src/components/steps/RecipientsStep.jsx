export function RecipientsStep({ recipientsRaw, recipientsCount, onRecipientsChange, onBack, onNext }) {
  return (
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
        onChange={(e) => onRecipientsChange(e.target.value)}
      />
      <p className="text-xs text-black/45">
        Parsed: {recipientsCount} address{recipientsCount === 1 ? "" : "es"}
      </p>
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
