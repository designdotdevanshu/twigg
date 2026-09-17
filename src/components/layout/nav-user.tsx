"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, Settings, LogOut } from "lucide-react";

interface NavUserProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { currentWorkspace } = useWorkspace();
  const { handleLogout } = useAuth();

  const userInitial = user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-sidebar-border/70 bg-sidebar/50 hover:bg-sidebar-accent h-12 rounded-lg border p-2 transition"
              tooltip={{
                children: user.name ?? "Account",
                hidden: false,
              }}
            >
              <Avatar className="size-8 shrink-0 rounded-lg border border-emerald-500/20">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                <AvatarFallback className="rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {userInitial}
                </AvatarFallback>
              </Avatar>

              <div className="ml-2.5 grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-foreground truncate text-xs font-semibold">
                  {user.name ?? "Account"}
                </span>
                <span className="text-muted-foreground truncate text-[10px]">
                  {user.email ?? ""}
                </span>
              </div>

              <ChevronsUpDown className="text-muted-foreground/60 ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="border-border/80 bg-popover/98 w-64 rounded-xl border p-1.5 shadow-xl backdrop-blur-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* User Identity Card */}
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9 shrink-0 rounded-lg border border-emerald-500/20">
                  <AvatarImage
                    src={user.image ?? ""}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback className="rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 overflow-hidden text-left text-xs leading-tight">
                  <span className="text-foreground truncate text-xs font-semibold">
                    {user.name ?? "Account"}
                  </span>
                  <span className="text-muted-foreground truncate text-[11px]">
                    {user.email ?? ""}
                  </span>
                </div>
              </div>

              {/* Active Workspace Status Badge */}
              <div className="bg-muted/60 text-muted-foreground border-border/60 mt-2.5 flex items-center justify-between rounded-md border px-2 py-1 text-[10px]">
                <span className="text-foreground flex items-center gap-1.5 truncate font-medium">
                  <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="truncate">{currentWorkspace.name}</span>
                </span>
                <span className="text-muted-foreground bg-background border-border/60 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase">
                  {currentWorkspace.type === "PERSONAL"
                    ? "Personal"
                    : "Business"}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" />

            {/* Menu Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${currentWorkspace.id}/settings`}
                  className="text-foreground hover:bg-accent focus:bg-accent flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition"
                >
                  <Settings className="text-muted-foreground size-4 shrink-0" />
                  <span>Settings & Preferences</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            {/* Theme / Appearance */}
            <div className="flex items-center justify-between px-2 py-1.5 text-xs">
              <span className="text-muted-foreground text-xs font-medium">
                Appearance
              </span>
              <ThemeToggle />
            </div>

            <DropdownMenuSeparator className="my-1" />

            {/* Sign Out Action */}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleLogout()}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
