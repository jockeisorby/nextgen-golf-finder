import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import {
  competitionMatchesLocalTerms,
  localSearchTermsFromFilters,
  searchPhraseFromFilters,
} from "../search-terms";
import { defaultDateRange } from "./date";
import type {
  CompetitionDetail,
  CompetitionSearchResult,
  CompetitionSummary,
  MinGolfSearchPayload,
  OtherOptionGroup,
  SearchFilters,
  SearchOverview,
} from "./types";

const MIN_GOLF_BASE_URL = "https://mingolf.golf.se/tavling";
const REQUEST_TIMEOUT_MS = 10_000;
const MIN_GOLF_PAGE_SIZE = 25;
const LOCAL_FILTER_MAX_UPSTREAM_PAGES = 4;

const DEFAULT_OTHER_OPTIONS: Record<OtherOptionGroup, string[]> = {
  gameType: ["1", "2"],
  gameComposition: ["1", "2", "3"],
  gender: ["0", "1", "3"],
  openFor: ["1", "2", "3"],
};

const stringId = z.union([z.string(), z.number()]).transform(String);

const rawOverviewSchema = z.object({
  clubsAndDistricts: z.object({
    allClubs: z.array(
      z.object({
        id: stringId,
        name: z.string(),
        districtId: stringId.optional(),
      }),
    ),
    allDistricts: z.array(
      z.object({
        id: stringId,
        name: z.string(),
      }),
    ),
  }),
  otherOptions: z.object({
    gameType: z.array(z.object({ id: stringId, name: z.string() })),
    gameComposition: z.array(z.object({ id: stringId, name: z.string() })),
    gender: z.array(z.object({ id: stringId, name: z.string() })),
    openFor: z.array(z.object({ id: stringId, name: z.string() })),
  }),
  classifications: z.array(
    z.object({
      groupName: z.string(),
      name: z.string(),
      fullName: z.string(),
    }),
  ),
});

const rawSearchSchema = z.object({
  rows: z.array(z.unknown()),
  totalCount: z.number().default(0),
});

const rawCompetitionDetailSchema = z.object({
  details: z
    .object({
      competitionName: z.string().optional(),
      competitionDate: z.string().optional(),
      clubName: z.string().optional(),
      courseName: z.string().optional(),
      entryDates: z.string().optional(),
      firstStart: z.string().optional(),
      entriesCount: z
        .array(
          z.object({
            signedUpEntries: z.number().optional(),
            classType: z.string().optional(),
          }),
        )
        .optional(),
      competitionLogo: z.string().optional(),
    })
    .default({}),
  information: z
    .object({
      gameType: z.string().optional(),
      openFor: z.string().optional(),
      roundFormat: z.string().optional(),
      status: z.string().optional(),
      entryFeeSum: z.string().optional(),
      greenfeeName: z.string().optional(),
      greenfeeSum: z.string().optional(),
      startListPublicationDate: z.string().optional(),
      contacts: z.array(z.string()).optional(),
      note: z.string().optional(),
    })
    .default({}),
  classes: z.array(z.unknown()).default([]),
  other: z
    .object({
      venueName: z.string().optional(),
      address: z.string().optional(),
      instructions: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    })
    .default({}),
  status: z
    .object({
      entryWindowOpen: z.boolean().optional(),
      showEntryList: z.boolean().optional(),
      showStartList: z.boolean().optional(),
      showResultList: z.boolean().optional(),
      showParticipantList: z.boolean().optional(),
      isPayable: z.boolean().optional(),
      playersCanSelectTeeTime: z.boolean().optional(),
    })
    .default({}),
  signUpOptions: z
    .object({
      canOnlyBeSignedUpAsSingle: z.boolean().optional(),
      canOnlyBeSignedUpAsTeam: z.boolean().optional(),
      canBeSignedUpAsSingleOrTeam: z.boolean().optional(),
    })
    .optional(),
});

export class MinGolfError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = "MinGolfError";
  }
}

export function minGolfInformationUrl(id: string) {
  return `${MIN_GOLF_BASE_URL}/information/${id}`;
}

export function sanitizeMinGolfHtml(value?: string) {
  if (!value) return undefined;

  const cleaned = sanitizeHtml(value, {
    allowedTags: [
      "a",
      "b",
      "br",
      "em",
      "i",
      "li",
      "ol",
      "p",
      "span",
      "strong",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  }).trim();

  return cleaned || undefined;
}

function optionGroup(group: OtherOptionGroup, selected?: string[]) {
  const ids = selected?.length ? selected : DEFAULT_OTHER_OPTIONS[group];
  return ids.map((id) => ({ group, id, name: "" as const }));
}

function normalizedPage(value?: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, value ?? 1);
}

function extractFirstRoundDate(classes: unknown[]) {
  const schema = z.object({
    rounds: z.array(z.object({ date: z.string() })).optional(),
  });

  for (const item of classes) {
    const parsed = schema.safeParse(item);
    const firstRoundDate = parsed.success
      ? parsed.data.rounds?.[0]?.date
      : undefined;
    if (firstRoundDate) return firstRoundDate;
  }

  return undefined;
}

function formatRestrictionList(restrictions: unknown) {
  const parsed = z
    .object({
      hcp: z.array(z.object({ value: z.string().optional() })).optional(),
      ages: z.array(z.object({ value: z.string().optional() })).optional(),
      tees: z.array(z.object({ value: z.string().optional() })).optional(),
    })
    .safeParse(restrictions);

  if (!parsed.success) return [];

  const groups = [
    ["HCP", parsed.data.hcp],
    ["Ålder", parsed.data.ages],
    ["Tee", parsed.data.tees],
  ] as const;

  return groups.flatMap(([label, values]) => {
    const uniqueValues = Array.from(
      new Set(values?.map((item) => item.value).filter(Boolean)),
    );

    return uniqueValues.map((value) => `${label}: ${value}`);
  });
}

function teamSizeLabel(minTeamSize?: number, maxTeamSize?: number) {
  if (!minTeamSize && !maxTeamSize) return undefined;
  if (minTeamSize && maxTeamSize && minTeamSize === maxTeamSize) {
    return `${minTeamSize} spelare`;
  }
  if (minTeamSize && maxTeamSize)
    return `${minTeamSize}-${maxTeamSize} spelare`;
  if (minTeamSize) return `Minst ${minTeamSize} spelare`;
  return `Max ${maxTeamSize} spelare`;
}

export function buildMinGolfSearchPayload(
  filters: SearchFilters,
): MinGolfSearchPayload {
  const defaults = defaultDateRange();
  const clubIds = filters.clubIds?.filter(Boolean) ?? [];
  const hasCustomClubOrDistrict =
    clubIds.length > 0 || Boolean(filters.districtId);

  return {
    searchPhrase: searchPhraseFromFilters(filters),
    dates: {
      from: filters.from || defaults.from,
      to: filters.to || defaults.to,
      onlyWeekend: Boolean(filters.onlyWeekend),
    },
    selectedClubAndDistrict: {
      option: hasCustomClubOrDistrict ? undefined : "AllClubs",
      clubIds,
      districtId: filters.districtId ?? null,
    },
    classification: filters.classification || null,
    onlyGetFollowedCompetitions: false,
    otherOptions: {
      gameType: optionGroup("gameType", filters.gameType),
      gameComposition: optionGroup("gameComposition", filters.gameComposition),
      gender: optionGroup("gender", filters.gender),
      openFor: optionGroup("openFor", filters.openFor),
    },
    onlyShowScratchCompetitions: false,
    pagination: normalizedPage(filters.page),
    sortOption: {
      value: "StartDate",
      sortOrder: "Ascending",
    },
  };
}

export function normalizeSearchOverview(input: unknown): SearchOverview {
  const overview = rawOverviewSchema.parse(input);
  return {
    clubs: overview.clubsAndDistricts.allClubs.map((club) => ({
      id: club.id,
      name: club.name.trim(),
      districtId: club.districtId,
    })),
    districts: overview.clubsAndDistricts.allDistricts.map((district) => ({
      id: district.id,
      name: district.name.trim(),
    })),
    classifications: overview.classifications,
    otherOptions: overview.otherOptions,
  };
}

function normalizeCompetitionSummary(
  input: unknown,
): CompetitionSummary | null {
  const row = z
    .object({
      competition: z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        name: z.string(),
      }),
      club: z
        .object({
          arrangingClubName: z.string().optional(),
          arrangingClubId: z.string().optional(),
          arrangingDistrictId: z.string().optional(),
          courseName: z.string().optional(),
        })
        .default({}),
      startDate: z.string(),
      gameFormat: z.string().optional(),
      isFollowed: z.boolean().optional(),
    })
    .safeParse(input);

  if (!row.success) return null;
  const { competition, club, startDate, gameFormat, isFollowed } = row.data;

  return {
    id: competition.id,
    name: competition.name,
    startDate,
    clubName: club.arrangingClubName ?? "Okänd klubb",
    clubId: club.arrangingClubId,
    districtId: club.arrangingDistrictId,
    courseName: club.courseName,
    gameFormat,
    isFollowed,
    minGolfUrl: minGolfInformationUrl(competition.id),
  };
}

export function normalizeSearchResults(
  input: unknown,
  page = 1,
): CompetitionSearchResult {
  const parsed = rawSearchSchema.parse(input);
  const competitions = parsed.rows
    .map(normalizeCompetitionSummary)
    .filter((row): row is CompetitionSummary => Boolean(row));

  return {
    competitions,
    totalCount: parsed.totalCount,
    page,
    pageSize: MIN_GOLF_PAGE_SIZE,
    hasMore: page * MIN_GOLF_PAGE_SIZE < parsed.totalCount,
  };
}

export function normalizeCompetitionDetail(
  id: string,
  input: unknown,
): CompetitionDetail {
  const parsed = rawCompetitionDetailSchema.parse(input);
  const detail = parsed.details;
  const info = parsed.information;
  const gameFormat = [info.roundFormat, info.gameType]
    .filter(Boolean)
    .join(", ");

  return {
    id,
    name: detail.competitionName ?? "Namnlös tävling",
    startDate:
      extractFirstRoundDate(parsed.classes) ?? detail.competitionDate ?? "",
    competitionDate: detail.competitionDate,
    clubName: detail.clubName ?? "Okänd klubb",
    courseName: detail.courseName,
    gameFormat: gameFormat || undefined,
    minGolfUrl: minGolfInformationUrl(id),
    entryDates: detail.entryDates,
    firstStart: detail.firstStart,
    status: info.status,
    openFor: info.openFor,
    entryFee: info.entryFeeSum,
    greenFeeName: info.greenfeeName,
    greenFee: info.greenfeeSum,
    startListPublicationDate: info.startListPublicationDate,
    contacts: info.contacts ?? [],
    noteHtml: sanitizeMinGolfHtml(info.note),
    addressHtml: sanitizeMinGolfHtml(parsed.other.address),
    instructionsHtml: sanitizeMinGolfHtml(parsed.other.instructions),
    venueName: parsed.other.venueName,
    logoUrl: detail.competitionLogo,
    latitude: parsed.other.latitude,
    longitude: parsed.other.longitude,
    entriesCount: detail.entriesCount ?? [],
    classes: parsed.classes
      .map((item) =>
        z
          .object({
            classId: z.union([z.string(), z.number()]).transform(String),
            className: z.string(),
            scoringMethod: z.string().optional(),
            classType: z.string().optional(),
            gender: z.string().optional(),
            entryCount: z.number().optional(),
            teamCount: z.number().optional(),
            minTeamSize: z.number().optional(),
            maxTeamSize: z.number().optional(),
            restrictions: z.unknown().optional(),
            rounds: z
              .array(
                z.object({
                  number: z.number().optional(),
                  date: z.string().optional(),
                  firstStartTime: z.string().optional(),
                  courseName: z.string().optional(),
                  holesCount: z.number().optional(),
                }),
              )
              .optional(),
            isFull: z.boolean().optional(),
          })
          .safeParse(item),
      )
      .filter((item) => item.success)
      .map((item) => ({
        id: item.data.classId,
        name: item.data.className,
        scoringMethod: item.data.scoringMethod,
        type: item.data.classType,
        gender: item.data.gender,
        entryCount: item.data.entryCount,
        teamCount: item.data.teamCount,
        teamSize: teamSizeLabel(item.data.minTeamSize, item.data.maxTeamSize),
        restrictions: formatRestrictionList(item.data.restrictions),
        rounds: item.data.rounds ?? [],
        isFull: item.data.isFull,
      })),
    isPayable: parsed.status.isPayable,
    entryWindowOpen: parsed.status.entryWindowOpen,
    showEntryList: parsed.status.showEntryList,
    showStartList: parsed.status.showStartList,
    showResultList: parsed.status.showResultList,
    showParticipantList: parsed.status.showParticipantList,
    playersCanSelectTeeTime: parsed.status.playersCanSelectTeeTime,
    signUpOptions: parsed.signUpOptions,
  };
}

async function fetchMinGolfJson<T>(
  path: string,
  init: RequestInit & { next?: { revalidate: number } } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${MIN_GOLF_BASE_URL}/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new MinGolfError(
        `Min Golf svarade med ${response.status}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof MinGolfError) throw error;
    throw new MinGolfError("Kunde inte hämta data från Min Golf");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getSearchOverview() {
  const raw = await fetchMinGolfJson<unknown>("/Competitions/Search/Overview", {
    method: "GET",
    next: { revalidate: 86_400 },
  });
  return normalizeSearchOverview(raw);
}

export async function searchCompetitions(filters: SearchFilters) {
  const localTerms = localSearchTermsFromFilters(filters);

  if (localTerms.length === 0) {
    const payload = buildMinGolfSearchPayload(filters);
    const raw = await fetchMinGolfJson<unknown>("/Competitions/Search", {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return normalizeSearchResults(raw, payload.pagination);
  }

  const requestedPage = Math.max(1, filters.page ?? 1);
  const targetCount = requestedPage * MIN_GOLF_PAGE_SIZE;
  const matches: CompetitionSummary[] = [];
  let upstreamPage = 1;
  let upstreamHasMore = true;

  while (
    matches.length < targetCount &&
    upstreamHasMore &&
    upstreamPage <= requestedPage + LOCAL_FILTER_MAX_UPSTREAM_PAGES - 1
  ) {
    const payload = buildMinGolfSearchPayload({
      ...filters,
      page: upstreamPage,
    });
    const raw = await fetchMinGolfJson<unknown>("/Competitions/Search", {
      method: "POST",
      body: JSON.stringify(payload),
      next: { revalidate: 120 },
    });
    const result = normalizeSearchResults(raw, upstreamPage);
    upstreamHasMore = result.hasMore;

    const pageMatches = await Promise.all(
      result.competitions.map(async (competition) => {
        if (competitionMatchesLocalTerms(competition, localTerms)) {
          return competition;
        }

        try {
          const detail = await getCompetitionDetail(competition.id);
          return competitionMatchesLocalTerms(detail, localTerms)
            ? competition
            : null;
        } catch {
          return null;
        }
      }),
    );

    matches.push(
      ...pageMatches.filter((competition): competition is CompetitionSummary =>
        Boolean(competition),
      ),
    );
    upstreamPage += 1;
  }

  const start = (requestedPage - 1) * MIN_GOLF_PAGE_SIZE;
  const competitions = matches.slice(start, start + MIN_GOLF_PAGE_SIZE);

  return {
    competitions,
    totalCount: matches.length,
    page: requestedPage,
    pageSize: MIN_GOLF_PAGE_SIZE,
    hasMore: matches.length > start + competitions.length || upstreamHasMore,
  };
}

export async function getCompetitionDetail(id: string) {
  const raw = await fetchMinGolfJson<unknown>(`/Competitions/${id}`, {
    method: "GET",
    next: { revalidate: 600 },
  });
  return normalizeCompetitionDetail(id, raw);
}
