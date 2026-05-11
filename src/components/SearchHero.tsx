import { CalendarDays, Sparkles } from "lucide-react";

import type { SearchFilters } from "@/lib/min-golf/types";

type QuickChip = {
  label: string;
  value: SearchFilters;
};

export function SearchHero({
  onQuickFilter,
  quickChips,
}: {
  quickChips: QuickChip[];
  onQuickFilter: (filters: SearchFilters) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "url('/fairway.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-normal">
            <CalendarDays className="size-4" aria-hidden="true" />
            Min Golf tävlingssök
          </div>
          <h1 className="font-display text-4xl font-bold tracking-normal sm:text-5xl">
            Hitta nästa golftävling snabbare
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            Sök i svenska tävlingar, filtrera på period och arrangör, och öppna
            anmälan direkt i Min Golf.
          </p>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onQuickFilter(chip.value)}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-secondary-container"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
