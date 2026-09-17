"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { TeamSwitcher } from "@/components/workspace/team-switcher";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Layers,
  PiggyBank,
  BarChart3,
  QrCode,
  Settings,
} from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const { isMobile, setOpenMobile } = useSidebar();

  const navGroups = [
    {
      title: "Core",
      items: [
        {
          label: "Dashboard",
          href: `/${currentWorkspace.id}/dashboard`,
          icon: LayoutDashboard,
          active: pathname === `/${currentWorkspace.id}/dashboard`,
        },
        {
          label: "Accounts",
          href: `/${currentWorkspace.id}/accounts`,
          icon: CreditCard,
          active:
            pathname.startsWith(`/${currentWorkspace.id}/accounts`) ||
            pathname.startsWith(`/${currentWorkspace.id}/account/`),
        },
        {
          label: "Transactions",
          href: `/${currentWorkspace.id}/transactions`,
          icon: ArrowLeftRight,
          active:
            pathname === `/${currentWorkspace.id}/transactions` ||
            pathname.startsWith(`/${currentWorkspace.id}/transaction/`),
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Pockets",
          href: `/${currentWorkspace.id}/pockets`,
          icon: Layers,
          active: pathname === `/${currentWorkspace.id}/pockets`,
        },
        {
          label: "Budgets",
          href: `/${currentWorkspace.id}/budgets`,
          icon: PiggyBank,
          active: pathname === `/${currentWorkspace.id}/budgets`,
        },
      ],
    },
    {
      title: "Tools & Settings",
      items: [
        {
          label: "Reports",
          href: `/${currentWorkspace.id}/reports`,
          icon: BarChart3,
          active: pathname === `/${currentWorkspace.id}/reports`,
        },
        {
          label: "UPI Payments",
          href: `/${currentWorkspace.id}/upi`,
          icon: QrCode,
          active: pathname.startsWith(`/${currentWorkspace.id}/upi`),
        },
        {
          label: "Settings",
          href: `/${currentWorkspace.id}/settings`,
          icon: Settings,
          active: pathname === `/${currentWorkspace.id}/settings`,
        },
      ],
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border border-r"
      {...props}
    >
      {/* Header: Brand Row + TeamSwitcher */}
      <SidebarHeader className="gap-2 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs">
            T
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-foreground text-sm leading-none font-bold tracking-tight">
              twigg
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Content: Single clean navigation list with groups */}
      <SidebarContent className="px-2 py-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="py-1">
            <SidebarGroupLabel className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.label}
                      className="text-xs font-medium"
                    >
                      <Link
                        href={item.href}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: NavUser */}
      <SidebarFooter className="border-sidebar-border/60 border-t p-3">
        <TeamSwitcher />
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
