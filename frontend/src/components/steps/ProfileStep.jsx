export function ProfileStep({
  hint,
  name,
  email,
  phone,
  isSubmitting,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Your profile</h2>
        <p className="text-sm text-black/50">{hint}</p>
      </div>
      <label className="block text-sm font-medium">
        Full name
        <input
          required
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <input
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
