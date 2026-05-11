import type { CompetitionSearchResult } from "@/lib/min-golf/types";

import { CompetitionCard } from "./CompetitionCard";
import { EmptyState, ErrorState, LoadingState } from "./States";

export function CompetitionGrid({
  error,
  isLoadingMore = false,
  isLoading,
  onLoadMore,
  onRetry,
  result,
}: {
  error?: string;
  isLoadingMore?: boolean;
  isLoading: boolean;
  onLoadMore?: () => void;
  onRetry: () => void;
  result?: CompetitionSearchResult;
}) {
  if (isLoading) return <LoadingState />;
  if (error && (!result || result.competitions.length === 0)) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (!result || result.competitions.length === 0) return <EmptyState />;

  return (
    <section aria-label="Tävlingsresultat">
      <div className="gf-results-grid">
        {result.competitions.map((competition, index) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            index={index}
          />
        ))}
      </div>
      <div className="gf-results-footer">
        {error ? <p className="gf-load-more-error">{error}</p> : null}
        <p className="gf-results-count">
          Visar {result.competitions.length} av {result.totalCount} tävlingar
        </p>
        {result.hasMore && onLoadMore ? (
          <button
            type="button"
            className="gf-load-more-button"
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? "Laddar fler..." : "Visa fler tävlingar"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
