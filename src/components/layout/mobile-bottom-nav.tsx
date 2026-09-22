"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { LogoutButton } from "@/components/auth/signout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  QrCode,
  Menu,
  CreditCard,
  Layers,
  PiggyBank,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

interface MobileBottomNavProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const [moreOpen, setMoreOpen] = useState(false);

  const isPersonal = currentWorkspace.type === "PERSONAL";
  const isDashboard = pathname === `/${currentWorkspace.id}/dashboard`;
  const isTransactions =
    pathname === `/${currentWorkspace.id}/transactions` ||
    pathname.startsWith(`/${currentWorkspace.id}/transaction/`);
  const isUpi = pathname.startsWith(`/${currentWorkspace.id}/upi`);

  const moreItems = [
    ...(!isPersonal
      ? [
          {
            label: "Accounts",
            href: `/${currentWorkspace.id}/accounts`,
            icon: CreditCard,
            description: "Manage bank, savings, and operating accounts",
          },
          {
            label: "Sub-Funds",
            href: `/${currentWorkspace.id}/pockets`,
            icon: Layers,
            description: "Earmarked savings and goal allocations",
          },
          {
            label: "Budgets",
            href: `/${currentWorkspace.id}/budgets`,
            icon: PiggyBank,
            description: "Spending limits & category progress",
          },
          {
            label: "Reports",
            href: `/${currentWorkspace.id}/reports`,
            icon: BarChart3,
            description: "Charts, CSV data export & print reports",
          },
        ]
      : []),
    {
      label: "Accounts",
      href: `/${currentWorkspace.id}/accounts`,
      icon: CreditCard,
      description: "Manage bank, savings, and operating accounts",
    },
    {
      label: "Pockets",
      href: `/${currentWorkspace.id}/pockets`,
      icon: Layers,
      description: "Earmarked savings and goal allocations",
    },
    {
      label: "Budgets",
      href: `/${currentWorkspace.id}/budgets`,
      icon: PiggyBank,
      description: "Spending limits & category progress",
    },
    {
      label: "Reports",
      href: `/${currentWorkspace.id}/reports`,
      icon: BarChart3,
      description: "Charts, CSV data export & print reports",
    },
    {
      label: "Settings",
      href: `/${currentWorkspace.id}/settings`,
      icon: Settings,
      description: "Preferences, currency, profile",
    },
  ];

  return (
    <div className="bg-background/95 border-border safe-area-bottom fixed right-0 bottom-0 left-0 z-40 border-t px-2 py-1.5 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {/* 1. Dashboard */}
        {/* 1. Dashboard / Profile */}
        <Link
          href={`/${currentWorkspace.id}/dashboard`}
          className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition ${
            isDashboard
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="mb-0.5 size-5" />
          <span className="text-[10px]">Dashboard</span>
          <span className="text-[10px]">{isPersonal ? "Profile" : "Dashboard"}</span>
        </Link>

        {/* 2. Transactions */}
        <Link
          href={`/${currentWorkspace.id}/transactions`}
          className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition ${
            isTransactions
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="mb-0.5 size-5" />
          <span className="text-[10px]">Transactions</span>
        </Link>
        {!isPersonal && (
          <>
            {/* 2. Transactions */}
            <Link
              href={`/${currentWorkspace.id}/transactions`}
              className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition ${
                isTransactions
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowLeftRight className="mb-0.5 size-5" />
              <span className="text-[10px]">Transactions</span>
            </Link>

        {/* 3. Center Quick Add FAB */}
        <Link
          href={`/${currentWorkspace.id}/transaction/create`}
          className="-mt-5 flex flex-col items-center justify-center"
        >
          <div className="bg-foreground text-background border-background flex size-12 items-center justify-center rounded-full border-2 shadow-lg transition hover:scale-105 active:scale-95">
            <Plus className="size-6 stroke-[2.5]" />
          </div>
          <span className="text-muted-foreground mt-0.5 text-[10px] font-medium">
            Add
          </span>
        </Link>
            {/* 3. Center Quick Add FAB */}
            <Link
              href={`/${currentWorkspace.id}/transaction/create`}
              className="-mt-5 flex flex-col items-center justify-center"
            >
              <div className="bg-foreground text-background border-background flex size-12 items-center justify-center rounded-full border-2 shadow-lg transition hover:scale-105 active:scale-95">
                <Plus className="size-6 stroke-[2.5]" />
              </div>
              <span className="text-muted-foreground mt-0.5 text-[10px] font-medium">
                Add
              </span>
            </Link>
          </>
        )}

        {/* 4. UPI Pay */}
        {/* 4. UPI Pay / Links */}
        <Link
          href={`/${currentWorkspace.id}/upi`}
          className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition ${
            isUpi
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="mb-0.5 size-5" />
          <span className="text-[10px]">UPI Pay</span>
        </Link>

        {/* 5. More Drawer Trigger */}
        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition"
            >
              <Menu className="mb-0.5 size-5" />
              <span className="text-[10px]">More</span>
            </button>
          </DrawerTrigger>

          <DrawerContent className="bg-background text-foreground border-border">
            <DrawerHeader className="border-border border-b pb-3">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  <div className="flex size-6 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                    T
                  </div>
                  More
                </DrawerTitle>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>
            </DrawerHeader>

            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center justify-between rounded-xl p-3 transition ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted/50 text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${
                          active
                            ? "bg-foreground/10 text-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </Link>
                );
              })}

              {/* User Profile Info & Logout */}
              <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Avatar className="size-9 border border-emerald-500/20">
                    <AvatarImage
                      src={user.image ?? ""}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-foreground truncate text-xs font-semibold">
                      {user.name ?? "Account"}
                    </span>
                    <span className="text-muted-foreground truncate text-[10px]">
                      {user.email ?? ""}
                    </span>
                  </div>
                </div>

                <LogoutButton />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
