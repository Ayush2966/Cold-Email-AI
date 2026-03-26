export function GenerateStep({
  isGenerating,
  wordLimit,
  onWordLimitChange,
  onGenerate,
  onBackToUploads,
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div>
        <h2 className="font-display text-2xl text-ink">Generate draft</h2>
        <p className="text-sm text-black/50">Select the word limit and hit the generate button.</p>
      </div>
      <label className="block text-sm font-medium">
        Email word limit
        <select
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 outline-none ring-accent/30 focus:ring-2"
          value={wordLimit}
          onChange={(e) => onWordLimitChange(e.target.value)}
        >
          <option value="120">120 words</option>
          <option value="150">150 words</option>
          <option value="180">180 words</option>
          <option value="220">220 words</option>
        </select>
      </label>
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
