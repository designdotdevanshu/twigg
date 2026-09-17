"use client";

import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";
import { TeamSwitcher } from "@/components/workspace/team-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader() {
  const { currentWorkspace } = useWorkspace();

  return (
    <header className="border-border bg-background/95 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <Link
          href={`/${currentWorkspace.id}/dashboard`}
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs">
            T
          </div>
          <span className="text-foreground text-sm font-bold tracking-tight">
            twigg
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <TeamSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
