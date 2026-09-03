// Shared UI state components used across all data pages

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] animate-spin text-primary">
          progress_activity
        </span>
        <p className="text-body-md font-body-md">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px] p-8">
      <div className="bg-slate-surface border border-emergency-red/30 rounded-lg p-8 max-w-md text-center">
        <span className="material-symbols-outlined text-emergency-red text-[48px]">error</span>
        <h2 className="text-headline-md font-headline-md text-on-surface mt-4">
          Could Not Load Data
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2">
          The backend server is not responding. Make sure the backend is running.
        </p>
        <p className="text-data-mono font-data-mono text-emergency-red/80 mt-3 text-sm break-all">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-4 py-2 bg-primary text-on-primary rounded text-label-caps font-label-caps hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ message, icon = "inbox" }: { message: string; icon?: string }) {
  return (
    <tr>
      <td colSpan={99} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px]">{icon}</span>
          <p className="text-body-md font-body-md">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function EmptyCard({ message, icon = "inbox" }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-on-surface-variant py-12">
      <span className="material-symbols-outlined text-[36px]">{icon}</span>
      <p className="text-body-md font-body-md">{message}</p>
    </div>
  );
}
