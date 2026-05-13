import { SlidersHorizontal, Search } from "lucide-react";

import type { SearchFilters } from "@/lib/min-golf/types";

export function SearchForm({
  filters,
  isLoading,
  onChange,
  onOpenFilters,
  onSubmit,
}: {
  filters: SearchFilters;
  isLoading: boolean;
  onChange: (filters: SearchFilters) => void;
  onOpenFilters: () => void;
  onSubmit: (filters: SearchFilters) => void;
}) {
  return (
    <form
      className="gf-search-panel"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          ...filters,
          query: String(formData.get("query") ?? "").trim() || undefined,
          from: String(formData.get("from") ?? "") || undefined,
          to: String(formData.get("to") ?? "") || undefined,
          page: 1,
        });
      }}
    >
      <div className="gf-search-form-grid">
        <label className="gf-search-query-field block">
          <span className="gf-field-label">Sökord</span>
          <input
            id="competition-search"
            name="query"
            value={filters.query ?? ""}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value, page: 1 })
            }
            placeholder="Klubb, ort eller spelform"
            className="gf-input"
          />
        </label>
        <label className="block">
          <span className="gf-field-label">Från</span>
          <input
            type="date"
            name="from"
            value={filters.from ?? ""}
            onChange={(event) =>
              onChange({ ...filters, from: event.target.value, page: 1 })
            }
            className="gf-input"
          />
        </label>
        <label className="block">
          <span className="gf-field-label">Till</span>
          <input
            type="date"
            name="to"
            value={filters.to ?? ""}
            onChange={(event) =>
              onChange({ ...filters, to: event.target.value, page: 1 })
            }
            className="gf-input"
          />
        </label>
        <div className="gf-search-action-row">
          <button
            type="button"
            onClick={onOpenFilters}
            className="gf-filter-button"
            aria-label="Öppna filter"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="gf-search-submit flex-1 disabled:cursor-not-allowed disabled:opacity-70 md:flex-none"
          >
            <Search className="size-5" aria-hidden="true" />
            Sök
          </button>
        </div>
      </div>
    </form>
  );
}
