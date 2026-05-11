import { Bookmark, Search, User } from "lucide-react";
import Link from "next/link";

export function BottomNavBar({
  active = "search",
  mobileOnly = false,
}: {
  active?: "search" | "saved";
  mobileOnly?: boolean;
}) {
  return (
    <nav
      className={`gf-bottom-nav ${mobileOnly ? "gf-bottom-nav-mobile" : ""}`}
      aria-label="Primär navigation"
    >
      <Link
        href="/"
        className={`gf-bottom-nav-item ${active === "search" ? "gf-bottom-nav-active" : ""}`}
      >
        <Search className="size-6" aria-hidden="true" />
        <span>Sök</span>
      </Link>
      <Link
        href="/saved"
        className={`gf-bottom-nav-item ${active === "saved" ? "gf-bottom-nav-active" : ""}`}
      >
        <Bookmark className="size-6" aria-hidden="true" />
        <span>Sparat</span>
      </Link>
      <button
        type="button"
        className="gf-bottom-nav-item cursor-not-allowed opacity-60"
        aria-disabled="true"
      >
        <User className="size-6" aria-hidden="true" />
        <span>Profil</span>
      </button>
    </nav>
  );
}
