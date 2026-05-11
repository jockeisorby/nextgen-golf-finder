import { AlertCircle, Loader2, SearchX } from "lucide-react";

export function LoadingState({ label = "Laddar tävlingar" }: { label?: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-golf">
      <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
      <p className="font-display text-base font-semibold">{label}</p>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline bg-surface-container-lowest p-8 text-center">
      <SearchX className="size-8 text-primary" aria-hidden="true" />
      <div>
        <p className="font-display text-lg font-semibold">Inga tävlingar hittades</p>
        <p className="mt-1 max-w-md text-sm text-on-surface-variant">
          Testa en längre period, färre filter eller en annan klubb.
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-error/25 bg-red-50 p-6 text-on-surface shadow-golf">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-6 shrink-0 text-error" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-display text-base font-semibold">
            Sökningen kunde inte genomföras
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {message ?? "Min Golf svarade inte just nu."}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Försök igen
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
