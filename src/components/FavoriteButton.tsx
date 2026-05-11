"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";

import {
  isFavoriteCompetition,
  subscribeToFavorites,
  toggleFavoriteCompetition,
} from "@/lib/local-favorites";
import type { CompetitionSummary } from "@/lib/min-golf/types";

export function FavoriteButton({
  competition,
  variant = "icon",
}: {
  competition: CompetitionSummary;
  variant?: "icon" | "wide";
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setIsFavorite(isFavoriteCompetition(competition.id));
    sync();
    return subscribeToFavorites(sync);
  }, [competition.id]);

  return (
    <button
      type="button"
      className={
        variant === "wide"
          ? "gf-favorite-wide-button"
          : "gf-favorite-icon-button"
      }
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Ta bort ${competition.name} från sparade`
          : `Spara ${competition.name}`
      }
      onClick={() => setIsFavorite(toggleFavoriteCompetition(competition))}
    >
      <Bookmark
        className={isFavorite ? "size-5 fill-current" : "size-5"}
        aria-hidden="true"
      />
      {variant === "wide" ? (
        <span>{isFavorite ? "Sparad" : "Spara tävling"}</span>
      ) : null}
    </button>
  );
}
