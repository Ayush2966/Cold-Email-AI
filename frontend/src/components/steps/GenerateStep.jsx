export function GenerateStep({ isGenerating, onGenerate, onBackToUploads }) {
  return (
    <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Generate draft</h2>
        <p className="text-sm text-black/50">Calls Gemini with your PDFs (server-side).</p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isGenerating ? "Generating..." : "Run AI generation"}
      </button>
      <button type="button" onClick={onBackToUploads} className="text-sm text-black/50 underline">
        Back to uploads
      </button>
    </div>
  );
}
