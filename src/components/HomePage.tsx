"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  Medal,
  MessageCircle,
  Navigation,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { defaultDateRange, upcomingWeekendRange } from "@/lib/min-golf/date";
import { findNearestDistrict } from "@/lib/min-golf/local";
import type {
  ClubOption,
  CompetitionSearchResult,
  SearchFilters,
  SearchOverview,
} from "@/lib/min-golf/types";

import { ActiveFilterChips } from "./ActiveFilterChips";
import { AppShell } from "./AppShell";
import { BottomNavBar } from "./BottomNavBar";
import { CompetitionGrid } from "./CompetitionGrid";
import { FilterSheet } from "./FilterSheet";
import { SearchForm } from "./SearchForm";

const SENIOR_CLASSIFICATION = "Handicaptävlingar - Seniortävlingar";
const JUNIOR_CLASSIFICATION = "Handicaptävlingar - Juniortävlingar";

const HOME_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAr9av44Ft5c_FUfIhjZVUxLK6oPJHHWSgGTeDQhFIeamHXcpFJaUNYRAF2n6SEjiYV2mVsspxg8w1VrRWk8B8y0_ot7VmsrrDiUW8LVxwTukXLI-wFkDFKIWfERYTImy3dH3DG1mPC_FQwSd_N5_n68gbu6w4XdxOBmasHeC7U8G1jT7c9UbeQfLD2SNgOAaVE3jrUaVJwJ7k32MPHZxh8WWdsZ_DiC55vh_ayorXSZJFhtP5picUOS9p1rd2hyVOSdQMveXTgc9s";

function clubDisplayName(club: ClubOption) {
  return club.name
    .replace(/\s+Golfklubb$/i, " GK")
    .replace(/\s+Golf Club$/i, " GC")
    .trim();
}

function listParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.split(",").filter(Boolean) ?? [];
}

function normalizeFilters(filters: SearchFilters): SearchFilters {
  const defaults = defaultDateRange();
  return {
    query: filters.query?.trim() || undefined,
    from: filters.from || defaults.from,
    to: filters.to || defaults.to,
    onlyWeekend: Boolean(filters.onlyWeekend),
    clubIds: filters.clubIds?.filter(Boolean) ?? [],
    districtId: filters.districtId || null,
    classification: filters.classification || null,
    gameType: filters.gameType?.filter(Boolean) ?? [],
    gameComposition: filters.gameComposition?.filter(Boolean) ?? [],
    gender: filters.gender?.filter(Boolean) ?? [],
    openFor: filters.openFor?.filter(Boolean) ?? [],
    page: Math.max(1, filters.page ?? 1),
  };
}

function filtersFromParams(searchParams: URLSearchParams): SearchFilters {
  const defaults = defaultDateRange();
  return normalizeFilters({
    query: searchParams.get("q") ?? undefined,
    from: searchParams.get("from") ?? defaults.from,
    to: searchParams.get("to") ?? defaults.to,
    onlyWeekend: searchParams.get("weekend") === "1",
    clubIds: listParam(searchParams, "club"),
    districtId: searchParams.get("district"),
    classification: searchParams.get("classification"),
    gameType: listParam(searchParams, "gameType"),
    gameComposition: listParam(searchParams, "gameComposition"),
    gender: listParam(searchParams, "gender"),
    openFor: listParam(searchParams, "openFor"),
    page: Number(searchParams.get("page") ?? 1),
  });
}

function filtersToParams(filters: SearchFilters) {
  const normalized = normalizeFilters(filters);
  const params = new URLSearchParams();
  if (normalized.query) params.set("q", normalized.query);
  if (normalized.from) params.set("from", normalized.from);
  if (normalized.to) params.set("to", normalized.to);
  if (normalized.onlyWeekend) params.set("weekend", "1");
  if (normalized.clubIds?.length) params.set("club", normalized.clubIds.join(","));
  if (normalized.districtId) params.set("district", normalized.districtId);
  if (normalized.classification) {
    params.set("classification", normalized.classification);
  }
  if (normalized.gameType?.length) params.set("gameType", normalized.gameType.join(","));
  if (normalized.gameComposition?.length) {
    params.set("gameComposition", normalized.gameComposition.join(","));
  }
  if (normalized.gender?.length) params.set("gender", normalized.gender.join(","));
  if (normalized.openFor?.length) params.set("openFor", normalized.openFor.join(","));
  if ((normalized.page ?? 1) > 1) params.set("page", String(normalized.page));
  return params;
}

export function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const activeFilters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const [draftState, setDraftState] = useState<{
    key: string;
    filters: SearchFilters;
  }>({ key: searchKey, filters: activeFilters });
  const [overview, setOverview] = useState<SearchOverview>();
  const [overviewError, setOverviewError] = useState<string>();
  const [result, setResult] = useState<CompetitionSearchResult>();
  const [searchError, setSearchError] = useState<string>();
  const [isLoading, setIsLoading] = useState(searchKey.length > 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string>();
  const draftFilters =
    draftState.key === searchKey ? draftState.filters : activeFilters;
  const setDraftFilters = useCallback(
    (filters: SearchFilters) => setDraftState({ key: searchKey, filters }),
    [searchKey],
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/competitions/overview")
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunde inte läsa filter från Min Golf.");
        return (await response.json()) as SearchOverview;
      })
      .then((data) => {
        if (isMounted) setOverview(data);
      })
      .catch((error: Error) => {
        if (isMounted) setOverviewError(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSearch = useCallback((filters: SearchFilters, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    void fetch("/api/competitions/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeFilters(filters)),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Sökningen misslyckades.");
        }
        return (await response.json()) as CompetitionSearchResult;
      })
      .then((data) => {
        setSearchError(undefined);
        setResult((previous) => {
          if (!append || !previous) return data;

          const existingIds = new Set(
            previous.competitions.map((competition) => competition.id),
          );
          const nextCompetitions = data.competitions.filter(
            (competition) => !existingIds.has(competition.id),
          );

          return {
            ...data,
            competitions: [...previous.competitions, ...nextCompetitions],
          };
        });
      })
      .catch((error: Error) => {
        if (!append) setResult(undefined);
        setSearchError(error.message);
      })
      .finally(() => {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    if (searchKey.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => fetchSearch(activeFilters), 0);
    return () => window.clearTimeout(timeout);
  }, [activeFilters, fetchSearch, searchKey.length]);

  const updateUrl = useCallback(
    (filters: SearchFilters) => {
      const params = filtersToParams({ ...filters, page: 1 });
      const query = params.toString();
      setIsLoading(true);
      setSearchError(undefined);
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router],
  );

  const resetFilters = useCallback(() => {
    const defaults = normalizeFilters({});
    setDraftFilters(defaults);
    setLocationMessage(undefined);
    router.push(pathname);
    setIsFilterOpen(false);
  }, [pathname, router, setDraftFilters]);

  const runNearbySearch = useCallback(() => {
    setLocationMessage(undefined);

    if (!overview) {
      setLocationMessage("Filterdata laddas fortfarande. Försök igen strax.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationMessage("Din webbläsare stödjer inte platsdelning.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestDistrict(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          overview.districts,
        );

        if (!nearest) {
          setLocationMessage(
            "Kunde inte matcha platsen mot ett golfdistrikt.",
          );
          return;
        }

        setLocationMessage(
          `Söker i ${nearest.district.name}, ungefär ${Math.round(nearest.distanceKm)} km från distriktets mittpunkt.`,
        );
        updateUrl({
          ...activeFilters,
          query: undefined,
          districtId: nearest.district.id,
          clubIds: [],
        });
      },
      () => {
        setLocationMessage(
          "Platsdelning nekades. Välj distrikt eller klubb i filtret istället.",
        );
      },
      { enableHighAccuracy: false, maximumAge: 3_600_000, timeout: 8_000 },
    );
  }, [activeFilters, overview, updateUrl]);

  const quickChips = useMemo(() => {
    const weekend = upcomingWeekendRange();
    return [
      {
        label: "Denna helg",
        value: { ...activeFilters, ...weekend, onlyWeekend: true },
      },
      { label: "Scramble", value: { ...activeFilters, query: "scramble" } },
      {
        label: "Senior",
        value: { ...activeFilters, classification: SENIOR_CLASSIFICATION },
      },
      {
        label: "Junior",
        value: { ...activeFilters, classification: JUNIOR_CLASSIFICATION },
      },
    ];
  }, [activeFilters]);

  const shownCount = result?.competitions.length ?? 0;
  const totalCount = result?.totalCount ?? 0;
  const resultLabel = isLoading
    ? "Söker tävlingar via Min Golf"
    : totalCount > 0
      ? `Visar ${shownCount} av ${totalCount} tävlingar från Min Golf`
      : "Inga tävlingar matchar sökningen";
  const isHomeView = searchKey.length === 0;
  const selectedDistrict = activeFilters.districtId
    ? overview?.districts.find(
        (district) => district.id === activeFilters.districtId,
      )
    : undefined;
  const localClubs = selectedDistrict
    ? (overview?.clubs
        .filter((club) => club.districtId === selectedDistrict.id)
        .slice(0, 8) ?? [])
    : [];

  const runPopularSearch = useCallback(
    (query: string) => updateUrl({ ...activeFilters, query }),
    [activeFilters, updateUrl],
  );

  return (
    <AppShell
      topbarVariant={isHomeView ? "home" : "results"}
      onOpenFilters={() => setIsFilterOpen(true)}
      onSearch={() => document.getElementById("competition-search")?.focus()}
    >
      {isHomeView ? (
        <div className="gf-home-canvas">
          <section className="gf-home-hero" aria-labelledby="home-title">
            <div className="gf-home-copy">
              <h1 id="home-title" className="gf-home-title">
                Vart bär det av?
              </h1>
              <p className="gf-home-lead">
                Hitta din nästa tävling, filtrera fram rätt upplägg och öppna
                anmälan direkt i Min Golf.
              </p>
            </div>

            <form
              className="gf-home-search"
              onSubmit={(event) => {
                event.preventDefault();
                updateUrl(draftFilters);
              }}
            >
              <label className="sr-only" htmlFor="competition-search">
                Sökord
              </label>
              <MessageCircle className="gf-home-search-icon" aria-hidden="true" />
              <input
                id="competition-search"
                value={draftFilters.query ?? ""}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    query: event.target.value,
                    page: 1,
                  })
                }
                className="gf-home-search-input"
                placeholder="Hitta tävlingar på Gotland..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="gf-home-search-button"
              >
                <Search className="size-4 md:hidden" aria-hidden="true" />
                <span>Sök</span>
              </button>
            </form>

            <div className="gf-home-quick-row" aria-label="Snabbval">
              <button
                type="button"
                className="gf-home-chip-primary"
                onClick={runNearbySearch}
              >
                <Navigation className="size-[18px]" aria-hidden="true" />
                Tävlingar i närheten
              </button>
              <button
                type="button"
                className="gf-home-chip"
                onClick={() =>
                  updateUrl({
                    ...activeFilters,
                    classification: SENIOR_CLASSIFICATION,
                  })
                }
              >
                Seniortävlingar
              </button>
              <button
                type="button"
                className="gf-home-chip"
                onClick={() => runPopularSearch("lagspel")}
              >
                Lagspel
              </button>
              <button
                type="button"
                className="gf-home-chip"
                onClick={() =>
                  updateUrl({
                    ...activeFilters,
                    classification: JUNIOR_CLASSIFICATION,
                  })
                }
              >
                Junior
              </button>
            </div>
            {locationMessage ? (
              <p className="gf-location-message">{locationMessage}</p>
            ) : null}
          </section>

          <section className="gf-home-bento" aria-label="Utvalda sökvägar">
            <article className="gf-home-feature-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOME_HERO_IMAGE}
                alt="Golfbana i kvällsljus"
                className="gf-home-feature-image"
              />
              <div className="gf-home-feature-overlay" aria-hidden="true" />
              <div className="gf-home-feature-content">
                <span className="gf-home-feature-tag">LIVE NU</span>
                <h2 className="gf-home-feature-title">Visby GK Invitational</h2>
                <p className="gf-home-feature-text">
                  Se aktuella tävlingar på Gotland och hitta nästa start.
                </p>
                <button
                  type="button"
                  className="gf-home-feature-button"
                  onClick={() => runPopularSearch("Visby")}
                >
                  Visa detaljer
                </button>
              </div>
            </article>

            <div className="gf-home-side-stack">
              <article className="gf-home-mini-card">
                <div>
                  <div className="gf-home-mini-header">
                    <Users className="size-8 text-secondary" aria-hidden="true" />
                    <span>48 öppna starter</span>
                  </div>
                  <h3 className="gf-home-mini-title">Morgonpigga?</h3>
                  <p className="gf-home-mini-text">
                    Hitta tävlingar och rundor med tidiga starter.
                  </p>
                </div>
                <button
                  type="button"
                  className="gf-home-mini-button"
                  onClick={() => runPopularSearch("morgon")}
                >
                  Visa tidiga starter
                </button>
              </article>

              <article className="gf-home-ranking-card">
                <div>
                  <Medal className="mb-2 size-8" aria-hidden="true" />
                  <h3 className="gf-home-mini-title">Öppen anmälan</h3>
                  <p className="gf-home-mini-text">
                    Prioritera tävlingar där anmälan fortfarande är aktiv.
                  </p>
                </div>
                <div className="gf-home-ranking-footer">
                  <span className="gf-home-rank-badge">Nu</span>
                  <span>Filtrera fram öppna tävlingar</span>
                </div>
              </article>
            </div>
          </section>

          <section className="gf-home-trending" aria-labelledby="trending-title">
            <h2 id="trending-title" className="gf-home-section-title">
              Populärt just nu
            </h2>
            <div className="gf-home-trending-grid">
              {["Scramble Match", "Ullna GC", "Hcp-justering", "Bro Hof Slott"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    className="gf-home-trending-item"
                    onClick={() => runPopularSearch(label)}
                  >
                    <span className="gf-home-trending-icon">
                      <History className="size-5" aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="gf-main-canvas">
          <section className="gf-results-heading">
            <h2 className="gf-results-title">Tävlingar</h2>
            <p className="gf-results-subtitle">{resultLabel}</p>
          </section>

          <SearchForm
            filters={draftFilters}
            isLoading={isLoading}
            onChange={setDraftFilters}
            onOpenFilters={() => setIsFilterOpen(true)}
            onSubmit={() => updateUrl(draftFilters)}
          />

          <section
            className="gf-chip-scroll hide-scrollbar"
            aria-label="Snabbfilter"
          >
            <button
              type="button"
              className="gf-chip gf-chip-active"
              onClick={resetFilters}
            >
              Alla tävlingar
            </button>
            <button
              type="button"
              className="gf-chip gf-chip-nearby"
              onClick={runNearbySearch}
            >
              Nära mig
            </button>
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="gf-chip"
                onClick={() => updateUrl(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </section>

          <div className="gf-active-filter-row space-y-3">
            <ActiveFilterChips
              filters={activeFilters}
              overview={overview}
              onRemove={(key) => {
                const next = {
                  ...activeFilters,
                  [key]: key === "onlyWeekend" ? false : undefined,
                };
                if (
                  key === "clubIds" ||
                  key === "gameType" ||
                  key === "gameComposition" ||
                  key === "gender" ||
                  key === "openFor"
                ) {
                  next[key] = [];
                }
                if (key === "districtId" || key === "classification") {
                  next[key] = null;
                }
                updateUrl(next);
              }}
            />
            {overviewError ? (
              <p className="text-sm font-semibold text-error">{overviewError}</p>
            ) : null}
            {locationMessage ? (
              <p className="gf-location-message">{locationMessage}</p>
            ) : null}
          </div>

          {selectedDistrict && localClubs.length > 0 ? (
            <section
              className="gf-local-clubs-panel"
              aria-labelledby="local-clubs-title"
            >
              <div>
                <h3 id="local-clubs-title" className="gf-local-clubs-title">
                  Klubbar nära {selectedDistrict.name}
                </h3>
                <p className="gf-local-clubs-subtitle">
                  Begränsa sökningen till en lokal klubb.
                </p>
              </div>
              <div className="gf-local-clubs-row hide-scrollbar">
                {localClubs.map((club) => (
                  <button
                    key={club.id}
                    type="button"
                    className="gf-local-club-chip"
                    onClick={() =>
                      updateUrl({
                        ...activeFilters,
                        districtId: selectedDistrict.id,
                        clubIds: [club.id],
                      })
                    }
                  >
                    {clubDisplayName(club)}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div>
            <CompetitionGrid
              result={result}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              error={searchError}
              onLoadMore={() => {
                const nextPage = (result?.page ?? activeFilters.page ?? 1) + 1;
                fetchSearch({ ...activeFilters, page: nextPage }, true);
              }}
              onRetry={() => {
                setSearchError(undefined);
                fetchSearch(activeFilters);
              }}
            />
          </div>
        </div>
      )}

      <BottomNavBar mobileOnly={isHomeView} />
      <button
        type="button"
        className={isHomeView ? "hidden" : "gf-fab-filter"}
        onClick={() => setIsFilterOpen(true)}
        aria-label="Öppna filter"
      >
        <SlidersHorizontal className="size-6" aria-hidden="true" />
      </button>

      <FilterSheet
        filters={draftFilters}
        isOpen={isFilterOpen}
        overview={overview}
        onApply={() => {
          setIsFilterOpen(false);
          updateUrl(draftFilters);
        }}
        onChange={setDraftFilters}
        onClose={() => setIsFilterOpen(false)}
        onReset={resetFilters}
      />
    </AppShell>
  );
}
