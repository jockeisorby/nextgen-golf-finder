import { X } from "lucide-react";

import type { SearchFilters, SearchOverview } from "@/lib/min-golf/types";
import { formatDateLabel } from "@/lib/min-golf/date";

type FilterKey =
  | "query"
  | "from"
  | "to"
  | "onlyWeekend"
  | "clubIds"
  | "districtId"
  | "classification"
  | "gameType"
  | "gameComposition"
  | "gender"
  | "openFor";

function optionName(overview: SearchOverview | undefined, id: string) {
  return overview?.clubs.find((club) => club.id === id)?.name ?? id;
}

function selectedOptionLabel(
  overview: SearchOverview | undefined,
  key: "gameType" | "gameComposition" | "gender" | "openFor",
  ids: string[] | undefined,
) {
  const selected = ids ?? [];
  if (selected.length === 0) return undefined;

  const labels = selected.map(
    (id) => overview?.otherOptions[key].find((option) => option.id === id)?.name ?? id,
  );

  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

function classificationLabel(value: string) {
  const parts = value.split(" - ").filter(Boolean);
  return parts.at(-1) ?? value;
}

export function ActiveFilterChips({
  filters,
  overview,
  onRemove,
}: {
  filters: SearchFilters;
  overview?: SearchOverview;
  onRemove: (key: FilterKey) => void;
}) {
  const chips: Array<{ key: FilterKey; label: string }> = [];

  if (filters.query) chips.push({ key: "query", label: filters.query });
  if (filters.from)
    chips.push({ key: "from", label: `Från ${formatDateLabel(filters.from)}` });
  if (filters.to)
    chips.push({ key: "to", label: `Till ${formatDateLabel(filters.to)}` });
  if (filters.onlyWeekend) chips.push({ key: "onlyWeekend", label: "Helg" });
  if (filters.districtId) {
    chips.push({
      key: "districtId",
      label:
        overview?.districts.find((district) => district.id === filters.districtId)
          ?.name ?? filters.districtId,
    });
  }
  if (filters.clubIds?.[0]) {
    chips.push({ key: "clubIds", label: optionName(overview, filters.clubIds[0]) });
  }
  if (filters.classification) {
    chips.push({
      key: "classification",
      label: classificationLabel(filters.classification),
    });
  }
  (["gameType", "gameComposition", "gender", "openFor"] as const).forEach(
    (key) => {
      const label = selectedOptionLabel(overview, key, filters[key]);
      if (label) chips.push({ key, label });
    },
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Aktiva filter">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.label}`}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface-container px-3 py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span className="truncate">{chip.label}</span>
          <X className="size-4 shrink-0" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
