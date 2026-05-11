"use client";

import { X } from "lucide-react";

import type {
  OtherOptionGroup,
  SearchFilters,
  SearchOverview,
} from "@/lib/min-golf/types";

const OPTION_GROUP_LABELS: Record<OtherOptionGroup, string> = {
  gameType: "Tävlingsform",
  gameComposition: "Spelform",
  gender: "Klass",
  openFor: "Öppen för",
};

const GROUPS: OtherOptionGroup[] = [
  "gameType",
  "gameComposition",
  "gender",
  "openFor",
];

function toggleSelected(values: string[] | undefined, id: string) {
  const current = values ?? [];
  return current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];
}

export function FilterSheet({
  filters,
  isOpen,
  overview,
  onApply,
  onChange,
  onClose,
  onReset,
}: {
  filters: SearchFilters;
  isOpen: boolean;
  overview?: SearchOverview;
  onApply: () => void;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Stäng filter"
        onClick={onClose}
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-5 shadow-golf-lg sm:left-auto sm:right-4 sm:top-20 sm:h-auto sm:max-h-[calc(100vh-6rem)] sm:w-[28rem] sm:rounded-lg">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">Filter</h2>
            <p className="text-sm text-on-surface-variant">
              Begränsa sökningen till rätt tävlingar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-outline-variant text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Stäng filter"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block font-display text-sm font-semibold">
              Distrikt
            </span>
            <select
              value={filters.districtId ?? ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  districtId: event.target.value || null,
                  clubIds: [],
                  page: 1,
                })
              }
              className="h-12 w-full rounded-lg border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Alla distrikt</option>
              {overview?.districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-display text-sm font-semibold">
              Klubb
            </span>
            <select
              value={filters.clubIds?.[0] ?? ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  clubIds: event.target.value ? [event.target.value] : [],
                  page: 1,
                })
              }
              className="h-12 w-full rounded-lg border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Alla klubbar</option>
              {overview?.clubs
                .filter(
                  (club) =>
                    !filters.districtId || club.districtId === filters.districtId,
                )
                .map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-display text-sm font-semibold">
              Tävlingskategori
            </span>
            <select
              value={filters.classification ?? ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  classification: event.target.value || null,
                  page: 1,
                })
              }
              className="h-12 w-full rounded-lg border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Alla kategorier</option>
              {overview?.classifications.map((classification) => (
                <option
                  key={classification.fullName}
                  value={classification.fullName}
                >
                  {classification.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-outline-variant p-3">
            <input
              type="checkbox"
              checked={Boolean(filters.onlyWeekend)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  onlyWeekend: event.target.checked,
                  page: 1,
                })
              }
              className="size-5 accent-primary"
            />
            <span className="font-display text-sm font-semibold">
              Visa bara helgtävlingar
            </span>
          </label>

          {GROUPS.map((group) => (
            <fieldset key={group} className="space-y-2">
              <legend className="font-display text-sm font-semibold">
                {OPTION_GROUP_LABELS[group]}
              </legend>
              <div className="grid gap-2">
                {overview?.otherOptions[group].map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 rounded-lg border border-outline-variant px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={(filters[group] ?? []).includes(option.id)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          [group]: toggleSelected(filters[group], option.id),
                          page: 1,
                        })
                      }
                      className="size-4 accent-primary"
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="sticky bottom-0 mt-6 flex gap-2 border-t border-outline-variant bg-surface-container-lowest pt-4">
          <button
            type="button"
            onClick={onReset}
            className="h-12 flex-1 rounded-lg border border-outline-variant px-4 text-sm font-bold text-primary"
          >
            Rensa
          </button>
          <button
            type="button"
            onClick={onApply}
            className="h-12 flex-1 rounded-lg bg-primary px-4 text-sm font-extrabold text-on-primary"
          >
            Visa resultat
          </button>
        </div>
      </section>
    </div>
  );
}
