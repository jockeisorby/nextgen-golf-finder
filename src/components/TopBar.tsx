import { Bell, Search, SlidersHorizontal, Trophy } from "lucide-react";
import Link from "next/link";

export function TopBar({
  activeNav = "search",
  onOpenFilters,
  onSearch,
  variant = "results",
}: {
  activeNav?: "search" | "saved";
  onOpenFilters?: () => void;
  onSearch?: () => void;
  variant?: "home" | "results";
}) {
  return (
    <header className="gf-topbar">
      <Link
        href="/"
        className="gf-brand rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Trophy className="size-7 fill-primary/15" aria-hidden="true" />
        <span className="gf-brand-title">Tävla Golf</span>
      </Link>
      {variant === "home" ? (
        <>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primär">
            <Link
              className={`gf-nav-link ${activeNav === "search" ? "gf-nav-link-active" : ""}`}
              href="/"
            >
              Sök
            </Link>
            <Link
              className={`gf-nav-link ${activeNav === "saved" ? "gf-nav-link-active" : ""}`}
              href="/saved"
            >
              Sparat
            </Link>
            <button className="gf-nav-link" type="button" aria-disabled="true">
              Profil
            </button>
          </nav>
          <button
            type="button"
            className="gf-icon-button"
            aria-label="Notiser"
            disabled
          >
            <Bell className="size-6" aria-hidden="true" />
          </button>
        </>
      ) : (
        <div className="gf-topbar-actions">
          <button
            type="button"
            className="gf-icon-button"
            onClick={onOpenFilters}
            aria-label="Öppna filter"
          >
            <SlidersHorizontal className="size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="gf-icon-button"
            onClick={onSearch}
            aria-label="Fokusera textfält"
          >
            <Search className="size-6" aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
