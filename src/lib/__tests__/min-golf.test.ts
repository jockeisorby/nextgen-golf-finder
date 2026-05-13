import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getOverviewRoute } from "@/app/api/competitions/overview/route";
import { POST as postSearchRoute } from "@/app/api/competitions/search/route";
import {
  __resetSearchResultCacheForTests,
  buildMinGolfSearchPayload,
  normalizeCompetitionDetail,
  normalizeSearchOverview,
  normalizeSearchResults,
  sanitizeMinGolfHtml,
  searchCompetitions,
} from "@/lib/min-golf/api";
import { GET as getDetailRoute } from "../../app/api/competitions/[id]/route";

const overviewFixture = {
  clubsAndDistricts: {
    allClubs: [{ id: 101, name: " Gotlands GK ", districtId: 20 }],
    allDistricts: [{ id: 20, name: " Gotland " }],
  },
  otherOptions: {
    gameType: [{ id: 1, name: "Slagspel" }],
    gameComposition: [{ id: 2, name: "Singel" }],
    gender: [{ id: 0, name: "Alla" }],
    openFor: [{ id: 3, name: "Alla golfare" }],
  },
  classifications: [
    {
      groupName: "Handicaptävlingar",
      name: "Seniortävlingar",
      fullName: "Handicaptävlingar - Seniortävlingar",
    },
  ],
};

const searchFixture = {
  rows: [
    {
      competition: { id: 5637131, name: "Gotland Open" },
      club: {
        arrangingClubName: "Visby GK",
        arrangingClubId: "101",
        arrangingDistrictId: "20",
        courseName: "Visby",
      },
      startDate: "2026-05-23",
      gameFormat: "Scramble",
      isFollowed: false,
    },
    { invalid: true },
  ],
  totalCount: 2,
};

const detailFixture = {
  details: {
    competitionName: "Gotland Open",
    competitionDate: "2026-05-23",
    clubName: "Visby GK",
    courseName: "Visby",
    entryDates: "2026-04-01 - 2026-05-20",
    firstStart: "08:00",
    entriesCount: [{ signedUpEntries: 14, classType: "A" }],
  },
  information: {
    gameType: "Partävling",
    roundFormat: "Scramble",
    openFor: "Alla",
    status: "Öppen",
    entryFeeSum: "250 kr",
    greenfeeName: "Tävlingsgreenfee",
    greenfeeSum: "150 kr",
    startListPublicationDate: "2026-05-21 12:00",
    contacts: ["Tävlingsledare"],
    note: '<p>Välkommen<script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">ful</a><a href="https://example.com">länk</a></p>',
  },
  classes: [
    {
      classId: 9,
      className: "A-klass",
      scoringMethod: "Poängbogey",
      classType: "Hcp",
      gender: "Mix",
      entryCount: 7,
      minTeamSize: 2,
      maxTeamSize: 4,
      restrictions: {
        hcp: [{ value: "+8,0 - 54,0" }],
        ages: [{ value: "18 - 99" }],
        tees: [{ value: "Gul" }, { value: "Röd" }],
      },
      rounds: [
        {
          number: 1,
          date: "2026-05-24",
          firstStartTime: "08:00",
          courseName: "Visby",
          holesCount: 18,
        },
      ],
    },
  ],
  other: {
    venueName: "Visby GK",
    address: '<p><a href="mailto:test@example.com">Mail</a></p>',
    instructions: "<p>Kör mot Visby Golfklubb.</p>",
    latitude: "57.62",
    longitude: "18.28",
  },
  status: {
    entryWindowOpen: true,
    showEntryList: true,
    showStartList: false,
    showResultList: false,
    showParticipantList: true,
    isPayable: true,
    playersCanSelectTeeTime: false,
  },
  signUpOptions: {
    canOnlyBeSignedUpAsSingle: false,
    canOnlyBeSignedUpAsTeam: true,
    canBeSignedUpAsSingleOrTeam: false,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Min Golf payloads and normalizers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T10:00:00.000Z"));
  });

  afterEach(() => {
    __resetSearchResultCacheForTests();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds the default Min Golf search payload", () => {
    const payload = buildMinGolfSearchPayload({});

    expect(payload.dates).toEqual({
      from: "2026-05-11",
      to: "2026-06-10",
      onlyWeekend: false,
    });
    expect(payload.selectedClubAndDistrict).toEqual({
      option: "AllClubs",
      clubIds: [],
      districtId: null,
    });
    expect(payload.otherOptions.gameType.map((option) => option.id)).toEqual([
      "1",
      "2",
    ]);
    expect(
      payload.otherOptions.gameComposition.map((option) => option.id),
    ).toEqual(["1", "2", "3"]);
    expect(payload.pagination).toBe(1);
  });

  it("trims search text and keeps selected filters", () => {
    const payload = buildMinGolfSearchPayload({
      query: " gotland ",
      terms: ["scramble", "poängbogey", "scramble"],
      onlyWeekend: true,
      clubIds: ["", "101"],
      districtId: "20",
      gameType: ["2"],
      page: Number.NaN,
    });

    expect(payload.searchPhrase).toBe("gotland");
    expect(payload.dates.onlyWeekend).toBe(true);
    expect(payload.selectedClubAndDistrict).toEqual({
      option: undefined,
      clubIds: ["101"],
      districtId: "20",
    });
    expect(payload.otherOptions.gameType).toEqual([
      { group: "gameType", id: "2", name: "" },
    ]);
    expect(payload.pagination).toBe(1);
  });

  it("normalizes overview ids and labels", () => {
    const overview = normalizeSearchOverview(overviewFixture);

    expect(overview.clubs).toEqual([
      { id: "101", name: "Gotlands GK", districtId: "20" },
    ]);
    expect(overview.districts).toEqual([{ id: "20", name: "Gotland" }]);
    expect(overview.otherOptions.gameType[0].id).toBe("1");
  });

  it("normalizes search results and skips malformed rows", () => {
    const result = normalizeSearchResults(searchFixture);

    expect(result.totalCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.hasMore).toBe(false);
    expect(result.competitions).toHaveLength(1);
    expect(result.competitions[0]).toMatchObject({
      id: "5637131",
      name: "Gotland Open",
      clubName: "Visby GK",
      isFollowed: false,
      minGolfUrl: "https://mingolf.golf.se/tavling/information/5637131",
    });
  });

  it("marks search results as pageable when total count exceeds the Min Golf page size", () => {
    const result = normalizeSearchResults(
      {
        rows: Array.from({ length: 25 }, (_, index) => ({
          competition: { id: index + 1, name: `Tävling ${index + 1}` },
          club: { arrangingClubName: "Testklubb" },
          startDate: "2026-05-23",
        })),
        totalCount: 52,
      },
      2,
    );

    expect(result.competitions).toHaveLength(25);
    expect(result.page).toBe(2);
    expect(result.hasMore).toBe(true);
  });

  it("normalizes detail data and sanitizes Min Golf HTML", () => {
    const detail = normalizeCompetitionDetail("5637131", detailFixture);

    expect(detail.startDate).toBe("2026-05-24");
    expect(detail.gameFormat).toBe("Scramble, Partävling");
    expect(detail.classes[0]).toMatchObject({
      id: "9",
      name: "A-klass",
      entryCount: 7,
      gender: "Mix",
      teamSize: "2-4 spelare",
      restrictions: [
        "HCP: +8,0 - 54,0",
        "Ålder: 18 - 99",
        "Tee: Gul",
        "Tee: Röd",
      ],
    });
    expect(detail.openFor).toBe("Alla");
    expect(detail.greenFee).toBe("150 kr");
    expect(detail.instructionsHtml).toContain("Visby Golfklubb");
    expect(detail.latitude).toBe("57.62");
    expect(detail.isPayable).toBe(true);
    expect(detail.signUpOptions?.canOnlyBeSignedUpAsTeam).toBe(true);
    expect(detail.noteHtml).toContain('href="https://example.com"');
    expect(detail.noteHtml).toContain('rel="noopener noreferrer"');
    expect(detail.noteHtml).not.toContain("script");
    expect(detail.noteHtml).not.toContain("javascript:");
    expect(detail.addressHtml).toContain("mailto:test@example.com");
  });

  it("strips unsafe HTML while keeping safe links", () => {
    const cleaned = sanitizeMinGolfHtml(
      '<p onclick="x()">Hej <a href="tel:+4670">ring</a><img src=x></p>',
    );

    expect(cleaned).toContain("tel:+4670");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).not.toContain("<img");
  });

  it("sends search through Min Golf with a non-null option payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(searchFixture));
    vi.stubGlobal("fetch", fetchMock);

    await searchCompetitions({ query: "gotland" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://mingolf.golf.se/tavling/api/Competitions/Search",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      }),
    );
    const requestBody = JSON.parse(
      fetchMock.mock.calls[0][1].body as string,
    ) as {
      otherOptions: Record<string, unknown[]>;
    };
    expect(requestBody.otherOptions.gameComposition).toHaveLength(3);
  });

  it("filters known app terms against competition detail data", async () => {
    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const requestUrl = String(url);
        if (requestUrl.endsWith("/Competitions/Search")) {
          const requestBody = JSON.parse(String(init?.body)) as {
            searchPhrase: string;
          };
          expect(requestBody.searchPhrase).toBe("");
          return jsonResponse(searchFixture);
        }

        if (requestUrl.endsWith("/Competitions/5637131")) {
          return jsonResponse(detailFixture);
        }

        return jsonResponse({ error: true }, 404);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchCompetitions({ terms: ["poängbogey"] });

    expect(result.competitions).toHaveLength(1);
    expect(result.competitions[0].name).toBe("Gotland Open");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reuses identical search filters for a short period", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(searchFixture));
    vi.stubGlobal("fetch", fetchMock);

    const filters = {
      query: "gotland",
      from: "2026-05-11",
      to: "2026-06-10",
      page: 1,
    };

    const first = await searchCompetitions(filters);
    const second = await searchCompetitions({ ...filters });

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("expires short-lived search cache entries", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(searchFixture)));
    vi.stubGlobal("fetch", fetchMock);

    const filters = {
      query: "gotland",
      from: "2026-05-11",
      to: "2026-06-10",
      page: 1,
    };

    await searchCompetitions(filters);
    vi.advanceTimersByTime(21_000);
    await searchCompetitions(filters);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("competition API routes", () => {
  afterEach(() => {
    __resetSearchResultCacheForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns overview data with cache headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(overviewFixture)),
    );

    const response = await getOverviewRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(body.clubs[0].name).toBe("Gotlands GK");
  });

  it("returns 400 for invalid search JSON", async () => {
    const response = await postSearchRoute(
      new Request("http://localhost/api/competitions/search", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("proxies search success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(searchFixture)),
    );

    const response = await postSearchRoute(
      new Request("http://localhost/api/competitions/search", {
        method: "POST",
        body: JSON.stringify({ query: "gotland" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.competitions[0].name).toBe("Gotland Open");
  });

  it("propagates upstream detail errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: true }, 404)),
    );

    const response = await getDetailRoute(
      new Request("http://localhost/api/competitions/404"),
      { params: Promise.resolve({ id: "404" }) },
    );

    expect(response.status).toBe(404);
  });
});
