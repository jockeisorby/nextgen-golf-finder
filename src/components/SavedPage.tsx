"use client";

import { useEffect, useState } from "react";

import {
  readFavoriteCompetitions,
  subscribeToFavorites,
} from "@/lib/local-favorites";
import type { CompetitionSummary } from "@/lib/min-golf/types";

import { AppShell } from "./AppShell";
import { BottomNavBar } from "./BottomNavBar";
import { CompetitionCard } from "./CompetitionCard";

export function SavedPage() {
  const [favorites, setFavorites] = useState<CompetitionSummary[]>([]);

  useEffect(() => {
    const sync = () => setFavorites(readFavoriteCompetitions());
    sync();
    return subscribeToFavorites(sync);
  }, []);

  return (
    <AppShell topbarVariant="home" activeNav="saved">
      <div className="gf-main-canvas">
        <section className="gf-results-heading">
          <h1 className="gf-results-title">Sparade tävlingar</h1>
          <p className="gf-results-subtitle">
            {favorites.length > 0
              ? `${favorites.length} tävling${favorites.length === 1 ? "" : "ar"} sparade lokalt i denna webbläsare`
              : "Spara tävlingar från resultatlistan för att hitta tillbaka snabbt."}
          </p>
        </section>

        {favorites.length > 0 ? (
          <section aria-label="Sparade tävlingar">
            <div className="gf-results-grid">
              {favorites.map((competition, index) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  index={index}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="gf-saved-empty">
            <h2 className="font-display text-2xl font-bold">Inget sparat än</h2>
            <p className="mt-2 text-on-surface-variant">
              Dina favoriter lagras bara lokalt på enheten. Ingen inloggning
              behövs.
            </p>
          </div>
        )}
      </div>
      <BottomNavBar active="saved" mobileOnly />
    </AppShell>
  );
}
