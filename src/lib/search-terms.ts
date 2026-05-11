import type {
  CompetitionDetail,
  CompetitionSummary,
  SearchFilters,
} from "./min-golf/types";

export type SearchTermChip = {
  label: string;
  term: string;
  aliases?: string[];
};

export const SEARCH_TERM_CHIPS: SearchTermChip[] = [
  {
    label: "Poängbogey",
    term: "poängbogey",
    aliases: ["poangbogey", "poäng bogey", "poang bogey", "bogey"],
  },
  { label: "Scramble", term: "scramble" },
  { label: "Slaggolf", term: "slaggolf" },
  { label: "Bästboll", term: "bästboll", aliases: ["bastboll", "bäst boll"] },
  { label: "Greensome", term: "greensome" },
  { label: "Foursome", term: "foursome" },
  { label: "Matchspel", term: "matchspel", aliases: ["match play", "match"] },
];

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9åäö\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function chipForTerm(term: string) {
  const normalized = normalizeForMatch(term);
  return SEARCH_TERM_CHIPS.find((chip) => {
    const aliases = [chip.term, chip.label, ...(chip.aliases ?? [])];
    return aliases.some((alias) => normalizeForMatch(alias) === normalized);
  });
}

export function uniqueSearchTerms(terms: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  terms.forEach((term) => {
    const normalized = normalizeTerm(term ?? "");
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function labelForSearchTerm(term: string) {
  const match = chipForTerm(term);
  return match?.label ?? term;
}

export function canonicalSearchTerm(term: string) {
  return chipForTerm(term)?.term;
}

export function localSearchTermsFromFilters(filters: SearchFilters) {
  return uniqueSearchTerms(
    (filters.terms ?? [])
      .map((term) => canonicalSearchTerm(term))
      .filter((term): term is string => Boolean(term)),
  );
}

export function freeTextTermsFromFilters(filters: SearchFilters) {
  return uniqueSearchTerms(
    [...(filters.terms ?? []), filters.query].filter(
      (term) => !term || !canonicalSearchTerm(term),
    ),
  );
}

export function inferSearchTerms(input?: string) {
  const trimmed = input?.trim();
  if (!trimmed) return [];

  let normalizedInput = ` ${normalizeForMatch(trimmed)} `;
  const matchedTerms: string[] = [];

  SEARCH_TERM_CHIPS.forEach((chip) => {
    const aliases = [chip.term, chip.label, ...(chip.aliases ?? [])].sort(
      (a, b) => b.length - a.length,
    );
    const matchedAlias = aliases.find((alias) =>
      normalizedInput.includes(` ${normalizeForMatch(alias)} `),
    );

    if (!matchedAlias) return;

    matchedTerms.push(chip.term);
    normalizedInput = normalizedInput.replace(
      ` ${normalizeForMatch(matchedAlias)} `,
      " ",
    );
  });

  const remaining = normalizedInput.replace(/\s+/g, " ").trim();
  return uniqueSearchTerms([...matchedTerms, remaining || undefined]);
}

export function toggleSearchTerm(
  currentTerms: string[] | undefined,
  term: string,
) {
  const normalized = normalizeTerm(term);
  const current = uniqueSearchTerms(currentTerms ?? []);

  return current.includes(normalized)
    ? current.filter((value) => value !== normalized)
    : [...current, normalized];
}

export function submitQueryAsTerms(filters: SearchFilters): SearchFilters {
  return {
    ...filters,
    query: undefined,
    terms: uniqueSearchTerms([
      ...(filters.terms ?? []),
      ...inferSearchTerms(filters.query),
    ]),
    page: 1,
  };
}

export function searchPhraseFromFilters(filters: SearchFilters) {
  return freeTextTermsFromFilters(filters).join(" ");
}

function termAliases(term: string) {
  const chip = chipForTerm(term);
  if (!chip) return [term];
  return [chip.term, chip.label, ...(chip.aliases ?? [])];
}

export function competitionMatchesLocalTerms(
  competition: CompetitionSummary | CompetitionDetail,
  terms: string[],
) {
  if (terms.length === 0) return true;

  const detail = competition as CompetitionDetail;
  const haystack = [
    competition.name,
    competition.clubName,
    competition.courseName,
    competition.gameFormat,
    detail.openFor,
    detail.status,
    detail.classes
      ?.flatMap((item) => [
        item.name,
        item.scoringMethod,
        item.type,
        item.gender,
        item.teamSize,
        ...item.restrictions,
      ])
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const normalizedHaystack = normalizeForMatch(haystack);

  return terms.every((term) =>
    termAliases(term).some((alias) =>
      normalizedHaystack.includes(normalizeForMatch(alias)),
    ),
  );
}
