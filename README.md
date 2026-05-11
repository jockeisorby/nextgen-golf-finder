# Nextgen Golf Finder

Mobilfokuserad Next.js-app för att hitta svenska golftävlingar via Min Golfs publika tävlingsendpoints.

## Kommandon

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run test:e2e
npm run visual:smoke
```

Öppna [http://localhost:3000](http://localhost:3000) när dev-servern kör.

## Arkitektur

- Frontend anropar bara interna Next API-routes under `/api/competitions/*`.
- Servern proxar Min Golf:
  - `GET /api/competitions/overview`
  - `POST /api/competitions/search`
  - `GET /api/competitions/[id]`
- Min Golf-länkar öppnas externt via `https://mingolf.golf.se/tavling/information/{id}`.

V1 innehåller ingen inloggning, profil, favoriter, notiser eller egen anmälan.
