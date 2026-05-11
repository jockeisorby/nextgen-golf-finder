import type { CompetitionSummary } from "@/lib/min-golf/types";

export const FAVORITES_STORAGE_KEY = "tavla-golf:favorites";
const FAVORITES_CHANGED_EVENT = "tavla-golf:favorites-changed";

export type FavoriteCompetition = CompetitionSummary;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readFavoriteCompetitions(): FavoriteCompetition[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteCompetition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavoriteCompetitions(favorites: FavoriteCompetition[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function isFavoriteCompetition(id: string) {
  return readFavoriteCompetitions().some((favorite) => favorite.id === id);
}

export function toggleFavoriteCompetition(competition: FavoriteCompetition) {
  const favorites = readFavoriteCompetitions();
  const exists = favorites.some((favorite) => favorite.id === competition.id);
  const next = exists
    ? favorites.filter((favorite) => favorite.id !== competition.id)
    : [competition, ...favorites];

  writeFavoriteCompetitions(next);
  return !exists;
}

export function subscribeToFavorites(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) callback();
  };

  window.addEventListener(FAVORITES_CHANGED_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
