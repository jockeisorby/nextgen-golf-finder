import { mkdir } from "node:fs/promises";

import { chromium } from "@playwright/test";

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

const captures = [
  {
    name: "home-390x844",
    width: 390,
    height: 844,
    url: "http://localhost:3000/",
    waitForText: "Vart bär det av?",
  },
  {
    name: "home-768x1024",
    width: 768,
    height: 1024,
    url: "http://localhost:3000/",
    waitForText: "Vart bär det av?",
  },
  {
    name: "results-390x844",
    width: 390,
    height: 844,
    url: "http://localhost:3000/?q=gotland",
    waitForText: "Gotland Open",
  },
  {
    name: "detail-1440x1000",
    width: 1440,
    height: 1000,
    url: "http://localhost:3000/competitions/5637131",
    waitForText: "Gotland Open",
  },
];

await mkdir("test-results/visual", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.route("**/api/competitions/overview**", async (route) => {
  await route.fulfill({ json: overview });
});
await page.route("**/api/competitions/search**", async (route) => {
  await route.fulfill({ json: { competitions: [competition], totalCount: 1 } });
});
await page.route("**/api/competitions/5637131**", async (route) => {
  await route.fulfill({ json: detail });
});

const results = [];

for (const capture of captures) {
  await page.setViewportSize({
    width: capture.width,
    height: capture.height,
  });
  await page.goto(capture.url, { waitUntil: "networkidle" });
  await page.waitForSelector(`text=${capture.waitForText}`);

  const path = `test-results/visual/${capture.name}.png`;
  await page.screenshot({ path, fullPage: true });

  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button, a, h1, h2, h3, p, span"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.overflowX === "hidden" || style.overflow === "hidden") {
          return false;
        }
        return element.scrollWidth > element.clientWidth + 1;
      })
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
      .slice(0, 10),
  );

  results.push({
    viewport: `${capture.width}x${capture.height}`,
    path,
    overflow,
  });
}

await browser.close();

const issues = results.filter((result) => result.overflow.length > 0);
console.log(JSON.stringify(results, null, 2));

if (issues.length > 0) {
  throw new Error("Visual smoke found text overflow.");
}
