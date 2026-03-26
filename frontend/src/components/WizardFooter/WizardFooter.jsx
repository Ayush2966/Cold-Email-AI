export function WizardFooter({ stepIndex, stepsLength, user, onSignOut }) {
  return (
    <footer className="mt-12 border-t border-black/5 pt-6 text-xs text-black/40">
      <div className="flex items-center justify-between gap-3">
        <span>
          Step {stepIndex + 1} of {stepsLength}
        </span>
        <span className="space-x-3">
          <a href="/privacy" className="underline">
            Privacy
          </a>
          <a href="/terms" className="underline">
            Terms
          </a>
        </span>
      </div>
      {user && (
        <span className="ml-2">
          · Signed in as {user.email}
          <button type="button" className="ml-2 underline" onClick={onSignOut}>
            Sign out
          </button>
        </span>
      )}
    </footer>
  );
}
