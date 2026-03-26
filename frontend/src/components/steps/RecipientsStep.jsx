import { useMemo, useState } from "react";

function parseRecipients(raw) {
  return raw
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function RecipientsStep({ recipientsRaw, recipientsCount, onRecipientsChange, onBack, onNext }) {
  const [draft, setDraft] = useState("");
  const recipients = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw]);

  const addFromDraft = () => {
    const next = draft.trim();
    if (!next) return;
    if (!recipients.includes(next)) {
      onRecipientsChange([...recipients, next].join("\n"));
    }
    setDraft("");
  };

  const removeRecipient = (target) => {
    onRecipientsChange(recipients.filter((email) => email !== target).join("\n"));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addFromDraft();
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Recipients</h2>
        <p className="text-sm text-black/50">Type an email and press Enter or comma to add a chip.</p>
      </div>
      <div className="min-h-24 rounded-lg border border-black/10 bg-white px-3 py-2 ring-accent/30 focus-within:ring-2">
        <div className="flex flex-wrap gap-2">
          {recipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-ink"
              style={{ backgroundColor: "#e5e7eb" }}
            >
              <span className="font-mono">{email}</span>
              <button
                type="button"
                onClick={() => removeRecipient(email)}
                className="text-black/50 hover:text-black"
                aria-label={`Remove ${email}`}
                font-size="20px"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="email"
            className="min-w-[220px] flex-1 border-0 bg-transparent py-1 text-sm outline-none"
            placeholder="hiring@company.com"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addFromDraft}
          />
        </div>
      </div>
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
