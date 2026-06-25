"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
        <span className="text-2xl font-bold text-white font-mono">F</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">You&apos;re Offline</h1>
      <p className="mb-6 max-w-sm text-center text-text-muted">
        FinSpace is currently unavailable. Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
      >
        Retry
      </button>
    </div>
  );
}
