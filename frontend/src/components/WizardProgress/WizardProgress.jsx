export function WizardProgress({ steps, step, token, onStepSelect }) {
  return (
    <ol className="mb-10 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => token && s.id <= step && onStepSelect(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              s.id === step
                ? "bg-ink text-white"
                : s.id < step
                  ? "bg-black/10 text-ink"
                  : "bg-black/5 text-black/35"
            }`}
          >
            {i + 1}. {s.title}
          </button>
        </li>
      ))}
    </ol>
  );
}
