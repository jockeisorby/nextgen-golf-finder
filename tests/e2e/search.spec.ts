import { expect, test } from "@playwright/test";

const overview = {
  clubs: [{ id: "101", name: "Visby GK", districtId: "20" }],
  districts: [{ id: "20", name: "Gotland" }],
  classifications: [
    {
      groupName: "Handicaptävlingar",
      name: "Seniortävlingar",
      fullName: "Handicaptävlingar - Seniortävlingar",
    },
  ],
  otherOptions: {
    gameType: [{ id: "1", name: "Slagspel" }],
    gameComposition: [{ id: "2", name: "Scramble" }],
    gender: [{ id: "0", name: "Alla" }],
    openFor: [{ id: "3", name: "Alla golfare" }],
  },
};

const competition = {
  id: "5637131",
  name: "Gotland Open",
  startDate: "2026-05-23",
  clubName: "Visby GK",
  clubId: "101",
  districtId: "20",
  courseName: "Visby",
  gameFormat: "Scramble",
  minGolfUrl: "https://mingolf.golf.se/tavling/information/5637131",
};

const secondCompetition = {
  ...competition,
  id: "5637132",
  name: "Scramble Plus",
  minGolfUrl: "https://mingolf.golf.se/tavling/information/5637132",
};

const detail = {
  ...competition,
  competitionDate: "2026-05-23",
  entryDates: "2026-04-01 - 2026-05-20",
  firstStart: "08:00",
  status: "Öppen",
  openFor: "Alla",
  entryFee: "250 kr",
  greenFeeName: "Tävlingsgreenfee",
  greenFee: "150 kr",
  startListPublicationDate: "2026-05-21 12:00",
  contacts: ["Tävlingsledare"],
  noteHtml: "<p>Välkommen till Gotland Open.</p>",
  addressHtml: "<p>Visby Golfklubb</p>",
  instructionsHtml: "<p>Kör mot Visby Golfklubb.</p>",
  venueName: "Visby GK",
  latitude: "57.62",
  longitude: "18.28",
  entriesCount: [{ signedUpEntries: 14, classType: "A" }],
  classes: [
    {
      id: "9",
      name: "A-klass",
      scoringMethod: "Poängbogey",
      type: "Hcp",
      gender: "Mix",
      entryCount: 7,
      teamSize: "2-4 spelare",
      restrictions: ["HCP: +8,0 - 54,0", "Ålder: 18 - 99"],
      rounds: [
        {
          number: 1,
          date: "2026-05-23",
          firstStartTime: "08:00",
          courseName: "Visby",
          holesCount: 18,
        },
      ],
    },
  ],
  isPayable: true,
  entryWindowOpen: true,
  showEntryList: true,
  showParticipantList: true,
  showStartList: false,
  showResultList: false,
  playersCanSelectTeeTime: false,
  signUpOptions: { canOnlyBeSignedUpAsTeam: true },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/competitions/overview**", async (route) => {
    await route.fulfill({ json: overview });
  });
  await page.route("**/api/competitions/search**", async (route) => {
    const payload = JSON.parse(route.request().postData() ?? "{}") as {
      query?: string;
      searchPhrase?: string;
      terms?: string[];
    };
    const searchPhrase =
      payload.query ?? payload.searchPhrase ?? payload.terms?.join(" ");
    await route.fulfill({
      json:
        searchPhrase === "empty"
          ? { competitions: [], totalCount: 0 }
          : {
              competitions: [competition],
              totalCount: 1,
              page: 1,
              pageSize: 25,
              hasMore: false,
            },
    });
  });
  await page.route("**/api/competitions/5637131**", async (route) => {
    await route.fulfill({ json: detail });
  });
});

test("searches competitions and opens the detail view", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Sökord").fill("gotland");
  await page.getByRole("button", { name: "Sök", exact: true }).click();

  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();
  await page.getByRole("link", { name: "Gotland Open" }).click();

  await expect(page.getByRole("heading", { name: "Gotland Open" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Öppna i Min Golf/ }).first(),
  ).toHaveAttribute(
    "href",
    "https://mingolf.golf.se/tavling/information/5637131",
  );
});

test("shows empty and error states", async ({ page }) => {
  await page.goto("/?q=empty");
  await expect(page.getByText("Inga tävlingar hittades")).toBeVisible();

  await page.route("**/api/competitions/search**", async (route) => {
    await route.fulfill({ status: 500, json: { error: "API nere" } });
  });
  await page.goto("/?q=gotland&from=2026-05-11");
  await expect(page.getByText("Sökningen kunde inte genomföras")).toBeVisible();
});

test("loads more competitions without replacing current results", async ({ page }) => {
  await page.unroute("**/api/competitions/search**");
  await page.route("**/api/competitions/search**", async (route) => {
    const payload = JSON.parse(route.request().postData() ?? "{}") as {
      page?: number;
    };
    const pageNumber = payload.page ?? 1;

    await route.fulfill({
      json: {
        competitions: [pageNumber === 1 ? competition : secondCompetition],
        totalCount: 2,
        page: pageNumber,
        pageSize: 1,
        hasMore: pageNumber === 1,
      },
    });
  });

  await page.goto("/?q=scramble");
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();

  await page.getByRole("button", { name: "Visa fler tävlingar" }).click();

  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scramble Plus" })).toBeVisible();
});

test("stores saved competitions locally in the browser", async ({ page }) => {
  await page.goto("/?q=gotland");
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();

  await page.getByRole("button", { name: "Spara Gotland Open" }).click();
  await page.getByRole("link", { name: "Sparat" }).first().click();

  await expect(page.getByRole("heading", { name: "Sparade tävlingar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();

  await page
    .getByRole("button", { name: "Ta bort Gotland Open från sparade" })
    .click();
  await expect(page.getByText("Inget sparat än")).toBeVisible();
});

test("uses browser location to search nearby competitions", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 57.64, longitude: 18.29 });

  await page.goto("/");
  await page.getByRole("button", { name: "Min region" }).first().click();

  await expect(page).toHaveURL(/district=20/);
  await expect(page.getByText(/Söker i Gotland/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Visby GK" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();
});

test("falls back to district selection when location is denied", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const denied = {
      code: 1,
      message: "denied",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: unknown,
          error?: (positionError: unknown) => void,
        ) => error?.(denied),
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Min region" }).first().click();

  await expect(page.getByText(/Platsdelning nekades/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Filter" })).toBeVisible();

  await page.getByLabel("Distrikt").selectOption("20");
  await page.getByRole("button", { name: "Visa resultat" }).click();

  await expect(page).toHaveURL(/district=20/);
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();
});

test("toggles game format chips as search filters", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Scramble" }).first().click();

  await expect(page).toHaveURL(/terms=scramble/);
  await expect(page.getByLabel("Aktiva filter")).toContainText("Scramble");
  await expect(page.getByRole("link", { name: "Gotland Open" })).toBeVisible();

  await page.getByRole("button", { name: "Scramble" }).first().click();
  await expect(page).not.toHaveURL(/terms=scramble/);
});
