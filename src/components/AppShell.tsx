import type { ReactNode } from "react";

import { TopBar } from "./TopBar";

export function AppShell({
  activeNav = "search",
  children,
  onOpenFilters,
  onSearch,
  topbarVariant = "results",
}: {
  activeNav?: "search" | "saved";
  children: ReactNode;
  onOpenFilters?: () => void;
  onSearch?: () => void;
  topbarVariant?: "home" | "results";
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopBar
        onOpenFilters={onOpenFilters}
        onSearch={onSearch}
        activeNav={activeNav}
        variant={topbarVariant}
      />
      <main>{children}</main>
    </div>
  );
}
