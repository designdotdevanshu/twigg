"use client";

import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  account: "Account Details",
  transactions: "Transactions",
  transaction: "New Transaction",
  pockets: "Pockets",
  budgets: "Budgets",
  reports: "Reports",
  upi: "UPI Payments",
  settings: "Settings",
};

export function ContentHeader() {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();

  const segments = pathname
    .replace(`/${currentWorkspace.id}/`, "")
    .split("/")
    .filter(Boolean);

  const pageKey = segments[0] ?? "dashboard";
  const pageLabel = routeLabels[pageKey] ?? "Dashboard";

  return (
    <header className="border-border bg-background hidden h-14 shrink-0 items-center justify-between border-b px-4 md:flex">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${currentWorkspace.id}/dashboard`}>
                {currentWorkspace.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
