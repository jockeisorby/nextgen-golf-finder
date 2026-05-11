"use client";

import { useEffect, useState } from "react";

import type { CompetitionDetail } from "@/lib/min-golf/types";

import { AppShell } from "./AppShell";
import { BottomNavBar } from "./BottomNavBar";
import { CompetitionDetailView } from "./CompetitionDetailView";
import { ErrorState, LoadingState } from "./States";

export function CompetitionDetailPageClient({ id }: { id: string }) {
  const [detail, setDetail] = useState<CompetitionDetail>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/competitions/${id}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Kunde inte läsa tävlingen.");
        }
        return (await response.json()) as CompetitionDetail;
      })
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((caught: Error) => {
        if (isMounted) setError(caught.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <AppShell topbarVariant="home">
      {isLoading || error ? (
        <div className="gf-main-canvas">
        {isLoading ? <LoadingState label="Laddar tävling" /> : null}
        {!isLoading && error ? <ErrorState message={error} /> : null}
        </div>
      ) : null}
      {!isLoading && detail ? <CompetitionDetailView detail={detail} /> : null}
      <BottomNavBar mobileOnly />
    </AppShell>
  );
}
