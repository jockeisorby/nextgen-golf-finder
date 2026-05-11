import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Flag,
  Map,
  MapPin,
  Receipt,
  Route,
  Users,
} from "lucide-react";

import { formatDateLabel } from "@/lib/min-golf/date";
import type { CompetitionDetail } from "@/lib/min-golf/types";

import { FavoriteButton } from "./FavoriteButton";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAVTpg4Oyh8Wb0iksMZyKkyXqN7Kxm4XU1c6Bn637BZAAEpleRDBi-1y2zx3fbIrM_PM0oYt9p5lKznXXl9P3B8hn1PPTtcoXUMBSq4dnn8YJLL1OhcCS32BJSmezbFdWTQQOh_txxj43XgWU7Gk3L4jlge1zMoM_okbxNrr13HeNnWX3M9DWIOATpZgIlb_UCHr2a8pzJwx5BlyotyffKkXuakVVOBUpQ1SCu3AXp1t4QONwS_0lV4dIcUMnN5i-xLOuEt7PzwQi0";

const MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCs8FvjF7kG2QZQYpZVvrGrPjMKTeakrLod-s7r39ZDFrPpdNsubF9fcLmc74F8YsuRvB0vvDb-ZdAnF6erAgxItAaemz2Ru3lUh1YthQSNAZSbmnyU3RxBnKhBLYbojAXf6AUXlNNW7KHHv3IX8iI1U97nXkqLeKZHQ7L_bJOGenvbJWS1dRjlEci5BO8Zfj8kxRP3PSzZwT2eTuYcSmleUnuRLhO4tI0F1RABqomEP4w4XkD4BPiPmOV6Q9zRoLm4Q1KDgE6e2Fg";

type DetailInfoCardProps = {
  icon: typeof CalendarDays;
  tone: "primary" | "error" | "secondary" | "tertiary";
  label: string;
  value?: string | number;
};

function DetailInfoCard({
  icon: Icon,
  label,
  tone,
  value,
}: DetailInfoCardProps) {
  if (!value) return null;

  return (
    <div className="gf-detail-info-card">
      <div className={`gf-detail-icon-box gf-detail-icon-${tone}`}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="gf-detail-label">{label}</p>
        <p className="gf-detail-value">{value}</p>
      </div>
    </div>
  );
}

function totalEntries(detail: CompetitionDetail) {
  return detail.entriesCount.reduce(
    (sum, entry) => sum + (entry.signedUpEntries ?? 0),
    0,
  );
}

function fieldSizeLabel(detail: CompetitionDetail) {
  const entries = totalEntries(detail);
  if (entries > 0) return `${entries} anmälda`;
  if (detail.classes.length > 0) return `${detail.classes.length} klasser`;
  return undefined;
}

function startLabel(detail: CompetitionDetail) {
  return (
    detail.firstStart ??
    formatDateLabel(detail.startDate || detail.competitionDate) ??
    detail.competitionDate
  );
}

function greenFeeLabel(detail: CompetitionDetail) {
  if (!detail.greenFee) return undefined;
  if (!detail.greenFeeName) return detail.greenFee;
  return `${detail.greenFeeName}: ${detail.greenFee}`;
}

function signUpModeLabel(detail: CompetitionDetail) {
  if (detail.signUpOptions?.canOnlyBeSignedUpAsTeam) return "Endast laganmälan";
  if (detail.signUpOptions?.canOnlyBeSignedUpAsSingle) {
    return "Endast individuell anmälan";
  }
  if (detail.signUpOptions?.canBeSignedUpAsSingleOrTeam) {
    return "Individuell eller laganmälan";
  }
  return undefined;
}

function listStatusItems(detail: CompetitionDetail) {
  return [
    { label: "Anmälningslista", active: detail.showEntryList },
    { label: "Deltagarlista", active: detail.showParticipantList },
    { label: "Startlista", active: detail.showStartList },
    { label: "Resultat", active: detail.showResultList },
  ];
}

function mapsUrl(detail: CompetitionDetail) {
  if (!detail.latitude || !detail.longitude) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`;
}

export function CompetitionDetailView({
  detail,
}: {
  detail: CompetitionDetail;
}) {
  const entries = totalEntries(detail);
  const venue = detail.venueName ?? detail.clubName;
  const registrationStatus = detail.entryWindowOpen
    ? "Öppen anmälan"
    : detail.status ?? "Competition";
  const googleMapsUrl = mapsUrl(detail);

  return (
    <article className="gf-detail-page">
      <section className="gf-detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="gf-detail-hero-image"
          src={HERO_IMAGE}
          alt={`${detail.name} golfbana`}
        />
        <div className="gf-detail-hero-overlay" />
        <div className="gf-detail-hero-content">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="gf-detail-badge">
              {detail.gameFormat ?? "Golf Tournament"}
            </span>
            <span className="gf-detail-badge gf-detail-badge-secondary">
              {registrationStatus}
            </span>
          </div>
          <h1 className="gf-detail-title">{detail.name}</h1>
          <p className="gf-detail-venue">
            <MapPin className="size-5" aria-hidden="true" />
            {venue}
            {detail.courseName ? `, ${detail.courseName}` : ""}
          </p>
        </div>
      </section>

      <div className="gf-detail-layout">
        <div className="space-y-6 md:col-span-2">
          <section className="gf-detail-panel">
            <h2 className="gf-detail-section-title">Om tävlingen</h2>
            {detail.noteHtml ? (
              <div
                className="html-content text-lg leading-8"
                dangerouslySetInnerHTML={{ __html: detail.noteHtml }}
              />
            ) : (
              <p className="text-lg leading-8 text-on-surface-variant">
                {detail.name} arrangeras av {detail.clubName}. Öppna tävlingen i
                Min Golf för komplett tävlingsinformation och anmälan.
              </p>
            )}
          </section>

          <section className="gf-detail-info-grid" aria-label="Tävlingsfakta">
            <DetailInfoCard
              icon={CalendarDays}
              tone="primary"
              label="Start"
              value={startLabel(detail)}
            />
            <DetailInfoCard
              icon={Clock}
              tone="error"
              label="Anmälningsperiod"
              value={detail.entryDates}
            />
            <DetailInfoCard
              icon={Users}
              tone="secondary"
              label="Startfält"
              value={fieldSizeLabel(detail)}
            />
            <DetailInfoCard
              icon={CreditCard}
              tone="tertiary"
              label="Tävlingsavgift"
              value={detail.entryFee}
            />
            <DetailInfoCard
              icon={Receipt}
              tone="tertiary"
              label="Greenfee"
              value={greenFeeLabel(detail)}
            />
            <DetailInfoCard
              icon={Flag}
              tone="primary"
              label="Öppen för"
              value={detail.openFor}
            />
            <DetailInfoCard
              icon={Route}
              tone="secondary"
              label="Anmälan"
              value={signUpModeLabel(detail)}
            />
            <DetailInfoCard
              icon={CheckCircle2}
              tone="primary"
              label="Betalning"
              value={detail.isPayable ? "Betalas via Min Golf" : undefined}
            />
          </section>

          {detail.classes.length > 0 ? (
            <section className="gf-detail-panel">
              <h2 className="gf-detail-section-title">Klasser</h2>
              <div className="gf-detail-class-list">
                {detail.classes.map((competitionClass) => (
                  <div className="gf-detail-class-row" key={competitionClass.id}>
                    <div>
                      <p className="font-display font-bold">
                        {competitionClass.name}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {[
                          competitionClass.type,
                          competitionClass.scoringMethod,
                          competitionClass.gender,
                          competitionClass.teamSize,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {competitionClass.rounds.length > 0 ? (
                        <div className="gf-detail-class-meta">
                          {competitionClass.rounds.map((round) => (
                            <span
                              key={`${competitionClass.id}-${round.number ?? round.date}`}
                            >
                              {[
                                round.date ? formatDateLabel(round.date) : undefined,
                                round.firstStartTime,
                                round.holesCount
                                  ? `${round.holesCount} hål`
                                  : undefined,
                                round.courseName,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {competitionClass.restrictions.length > 0 ? (
                        <div className="gf-detail-restriction-row">
                          {competitionClass.restrictions.map((restriction) => (
                            <span
                              className="gf-detail-restriction-chip"
                              key={restriction}
                            >
                              {restriction}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">
                        {competitionClass.entryCount ??
                          competitionClass.teamCount ??
                          "-"}
                      </p>
                      {competitionClass.isFull ? (
                        <p className="text-xs font-bold text-error">Full</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {(detail.instructionsHtml || detail.startListPublicationDate) ? (
            <section className="gf-detail-panel">
              <h2 className="gf-detail-section-title">Praktiskt</h2>
              {detail.startListPublicationDate ? (
                <div className="gf-detail-practical-row">
                  <p className="gf-detail-label">Startlista publiceras</p>
                  <p className="gf-detail-value">
                    {detail.startListPublicationDate}
                  </p>
                </div>
              ) : null}
              {detail.instructionsHtml ? (
                <div
                  className="html-content text-base"
                  dangerouslySetInnerHTML={{ __html: detail.instructionsHtml }}
                />
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="gf-detail-register-card">
            <p className="gf-detail-register-eyebrow">
              {detail.entryWindowOpen ? "Anmälan är öppen" : "Anmälan via Min Golf"}
            </p>
            <h2 className="gf-detail-register-title">
              {detail.entryWindowOpen ? "Redo att spela?" : "Se full information"}
            </h2>
            <a
              className="gf-detail-register-button"
              href={detail.minGolfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Öppna i Min Golf
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
            <FavoriteButton competition={detail} variant="wide" />
            <p className="gf-detail-register-note">
              {entries > 0
                ? `${entries} anmälda just nu`
                : detail.status ?? "Anmälan sker i Min Golf"}
            </p>
          </section>

          <section className="gf-detail-status-card">
            <h2 className="gf-detail-status-title">Tävlingsstatus</h2>
            <p className="gf-detail-status-main">{registrationStatus}</p>
            <div className="gf-detail-status-list">
              {listStatusItems(detail).map((item) => (
                <div className="gf-detail-status-row" key={item.label}>
                  <span>{item.label}</span>
                  <span
                    className={
                      item.active
                        ? "gf-detail-status-pill-active"
                        : "gf-detail-status-pill"
                    }
                  >
                    {item.active ? "Visas" : "Ej publicerad"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="gf-detail-map-card">
            <div className="gf-detail-map-header">
              <h2 className="font-display text-sm font-bold">{venue}</h2>
              <Map className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div className="gf-detail-map-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="gf-detail-map-image"
                src={MAP_IMAGE}
                alt={`${venue} karta`}
              />
              <div className="gf-detail-map-pin">
                <MapPin className="size-11 fill-error/20 text-error" aria-hidden="true" />
              </div>
            </div>
            <div className="gf-detail-map-address">
              {detail.addressHtml ? (
                <div
                  className="html-content text-sm"
                  dangerouslySetInnerHTML={{ __html: detail.addressHtml }}
                />
              ) : (
                <p className="text-sm text-on-surface-variant">{detail.clubName}</p>
              )}
              {googleMapsUrl ? (
                <a
                  className="gf-detail-map-link"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Öppna karta
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </section>

          {detail.contacts.length > 0 ? (
            <section className="gf-detail-panel">
              <h2 className="gf-detail-section-title">Kontakt</h2>
              <ul className="space-y-1 text-sm text-on-surface-variant">
                {detail.contacts.map((contact) => (
                  <li key={contact}>{contact}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

    </article>
  );
}
