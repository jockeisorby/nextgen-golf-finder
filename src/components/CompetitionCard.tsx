import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

import { formatDateLabel } from "@/lib/min-golf/date";
import type { CompetitionSummary } from "@/lib/min-golf/types";

import { FavoriteButton } from "./FavoriteButton";

const CARD_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDC3JuxONHujGlCkOx88e_Ib6OTXDCR3ahhrehm9jwApSz98MkV_8fyjYOYych9gHr89NjGmST-EHmWRj5YgfpGLHvaqcOAeVFvKPLL2CAZQlx6hxYXwSXnuCEKisBInduBJ8JA_JK61EHGCECpOemrYywEwaiSJZJyf3Iq-UdHWt_7BnMLzQQu3nFO6MLTFJkbv0zxxBOLeLGObTyn6h82P9hqmI2mvzRtWxNmcDnDjZihMt3k4oTs8CRz43Qg_awDzMfdnd7QqiA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB8T4W6a9cxj7rVg9OPBxUonPVb-DA32AjXPdMzYEZy7M7YrUwpjsZvo7DUE05NlFnStgyiUp_r_pbqIAPliirZjq9PkOkYXJYqm__blfiVrrqI6_uMsC7BmR_8NzkLh_D2kAsVeSq4qusGoYO0THiCqLj5ZIP0nXRFmYKstGkQKapJP8g8HnwQ7gDCWmZ2g3jjre5sWc-AY7HEzmbGUsKW1GoZE2ASWcDxmG7zaJWYEkP5QCHLovb7J-g988rntQCtiuVsrPSUNo0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBTSOQkbGr_Lk1ZQ6GbsXTayqHoNn_jJQ2fNaNbdVZhNs-PkdFKxfN461otLiic34aA_pLqCShCnSlm6pc__yetPDlosjvXsCRBMc0nwRG6WGPSfrpVGLpXyqqdVP3Uq9kVTSBZlw9F5HxRijOq0I7KrQbC3CRz6CiU1Y9FzfxchhOS5eumUuVnUjXlwNY9_85Bpec4mWPi3k9386RJrxlqvbu5MTaP3glxMV8cUIwFQIQX9QJNikrQ-x0UZJOwJEHkiJMmk5UlA30",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDLHsm38VtDLCMz03aLqTrY9k7ZZcR328tgVhCyS6Dji3waiy7iWv03Ja5ME2R2Dk1Ol2LEJF0zZo9-bNtNcyWpzlzBpDIJ8FSmZ3foHbHjQTWGnysY1ysJDIFTNg3iScRasQ2XoanhlnaeWPTqayDDWV1KvEd0s9HPrzC08szRTCd3D4x9D3nveaxB0dWtkPNsgWCIeDHn5BI0l6clj1a4O5_Znt8gQu0Ug5i3gjPrQ3Kb0mmmQz9FELb5LW75-u_sv6_Dn-DXOx4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDRugzGtb1lAOkYIzrQ0TmVnmCfVw-5BM4IIobmkVgdCpThKClM24sZEvsqTsjiKHa9dbG4wx-TVlPDP_snIwQX-TEZnjK86QiGOPGWhR70hKgs5WX9MoBZt1XlrTcYtRDylGws70OodN8JaROZrhk--xcBH2n_sqAtCPqZQcrI-x3U3CvMGuEIlIkZy6xt-o2JM_rOhFyBVP2h0kpvi5m4YgqaGMlZiXfhqAOs_aaaCASgjKUZtTiBzCI2BIzxkIaYIOP9hVU-9eU",
];

function cardImage(seed: string) {
  const hash = Array.from(seed).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return CARD_IMAGES[hash % CARD_IMAGES.length];
}

function formatTag(value?: string) {
  if (!value) return "Tävling";
  return value.split(",")[0]?.trim() || "Tävling";
}

export function CompetitionCard({
  competition,
  index,
}: {
  competition: CompetitionSummary;
  index: number;
}) {
  const isWide = index > 0 && index % 4 === 3;

  return (
    <article className={`gf-card group ${isWide ? "gf-card-wide" : ""}`}>
      <div className="gf-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="gf-card-image"
          src={cardImage(competition.id)}
          alt={`${competition.clubName} golfbana`}
        />
        {index === 0 ? <div className="gf-card-badge">PREMIUM</div> : null}
      </div>
      <div className="gf-card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="gf-card-tag">{formatTag(competition.gameFormat)}</span>
            <Link
              href={`/competitions/${competition.id}`}
              className="gf-card-title focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {competition.name}
            </Link>
          </div>
          <FavoriteButton competition={competition} />
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <div className="gf-card-meta">
            <CalendarDays className="size-[18px] shrink-0" aria-hidden="true" />
            <p className="gf-card-meta-strong">
              {formatDateLabel(competition.startDate) ?? "Datum saknas"}
            </p>
          </div>
          <div className="gf-card-meta">
            <MapPin className="size-[18px] shrink-0" aria-hidden="true" />
            <p className="text-base leading-6">
              <span className="font-semibold">{competition.clubName}</span>
              {competition.courseName ? `, ${competition.courseName}` : ""}
            </p>
          </div>
        </div>

        <div className="gf-card-actions">
          <Link
            href={`/competitions/${competition.id}`}
            className="gf-card-action-primary"
          >
            Visa detaljer
          </Link>
          <a
            href={competition.minGolfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gf-card-action-muted"
          >
            Öppna i Min Golf
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
