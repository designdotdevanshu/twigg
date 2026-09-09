"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/auth/signout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PlusCircle,
  User as UserIcon,
  Building2,
} from "lucide-react";

interface WorkspaceNavProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function WorkspaceNav({ user }: WorkspaceNavProps) {
  const pathname = usePathname();
  const { currentWorkspace, isPersonal } = useWorkspace();

  const isDashboard = pathname.endsWith("/dashboard");
  const isCreateTx = pathname.endsWith("/transaction/create");

  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Workspace Switcher */}
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href={`/${currentWorkspace.id}/dashboard`}
            className="flex items-center gap-2"
          >
            <div className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold shadow-xs">
              T
            </div>
            <span className="text-foreground hidden text-lg font-bold tracking-tight sm:inline">
              twigg
            </span>
          </Link>

          <div className="bg-border/60 h-5 w-px" />

          <WorkspaceSwitcher />
        </div>

        {/* Center: Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href={`/${currentWorkspace.id}/dashboard`}>
            <Button
              variant={isDashboard ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 text-xs font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Button>
          </Link>

          <Link href={`/${currentWorkspace.id}/transaction/create`}>
            <Button
              variant={isCreateTx ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 text-xs font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              New Transaction
            </Button>
          </Link>
        </nav>

        {/* Right: Mode Badge + Actions + Profile */}
        <div className="flex items-center gap-3">
          {/* Mode Pill Badge */}
          {isPersonal ? (
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 sm:flex dark:text-emerald-400">
              <UserIcon className="h-3 w-3" />
              <span>Personal Mode</span>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 sm:flex dark:text-indigo-400">
              <Building2 className="h-3 w-3" />
              <span>Business Mode</span>
            </div>
          )}

          <Link
            href={`/${currentWorkspace.id}/transaction/create`}
            className="md:hidden"
          >
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </Link>

          <ThemeToggle />

          {/* User Profile Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ring-offset-background focus:ring-ring flex items-center rounded-full transition hover:opacity-85 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
              >
                <Avatar className="border-border h-8 w-8 border">
                  <AvatarImage
                    src={user.image ?? ""}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-64 p-0 shadow-lg"
            >
              <div className="border-border/80 border-b p-3.5">
                <p className="text-foreground truncate text-xs font-semibold">
                  {user.name ?? "Account"}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {user.email ?? ""}
                </p>
              </div>

              <div className="p-1">
                <LogoutButton />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
