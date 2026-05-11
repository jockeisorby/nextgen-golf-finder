import { ExternalLink } from "lucide-react";

export function ExternalMinGolfButton({
  url,
  compact = false,
}: {
  url: string;
  compact?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-surface-container-lowest px-3 py-2 text-sm font-bold text-primary transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary-container px-5 py-3 text-sm font-extrabold text-on-secondary-container shadow-golf transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
      }
    >
      Öppna i Min Golf
      <ExternalLink className="size-4" aria-hidden="true" />
    </a>
  );
}
