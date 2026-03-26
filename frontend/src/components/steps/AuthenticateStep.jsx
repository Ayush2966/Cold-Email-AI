export function AuthenticateStep({ gmailConnected, onConnectGmail, onBack, onNext }) {
  return (
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
          onClick={onConnectGmail}
          className="w-full rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold shadow-sm"
        >
          Connect Gmail
        </button>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!gmailConnected}
          className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
