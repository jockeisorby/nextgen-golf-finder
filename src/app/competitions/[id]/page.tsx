import { CompetitionDetailPageClient } from "@/components/CompetitionDetailPageClient";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompetitionDetailPageClient id={id} />;
}
