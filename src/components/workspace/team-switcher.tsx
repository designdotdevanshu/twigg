"use client";

import * as React from "react";
import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { createWorkspace } from "@/actions/workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Check,
  ChevronsUpDown,
  Plus,
  User,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [currency, setCurrency] = useState("INR");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createWorkspace({
        name: name.trim(),
        type,
        currency,
      });

      if (res.success && res.data) {
        toast.success(`Created ${res.data.name} workspace`);
        setIsCreateOpen(false);
        setName("");
        switchWorkspace(res.data.id);
      } else {
        toast.error(res.error ?? "Failed to create workspace");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPersonal = currentWorkspace.type === "PERSONAL";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-sidebar-border/70 bg-sidebar/50 hover:bg-sidebar-accent h-12 rounded-lg border transition"
                tooltip={currentWorkspace.name}
              >
                <div
                  className={`flex aspect-square size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold shadow-xs ${
                    isPersonal
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {isPersonal ? (
                    <User className="size-3.5" />
                  ) : (
                    <Building2 className="size-3.5" />
                  )}
                </div>
                <div className="ml-2 grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate font-semibold">
                    {currentWorkspace.name}
                  </span>
                  <span className="text-muted-foreground truncate text-[10px]">
                    {isPersonal ? "Personal Account" : "Business Workspace"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 opacity-50 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="border-border w-64 rounded-lg border shadow-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={6}
            >
              <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((ws) => {
                const active = ws.id === currentWorkspace.id;
                const wsIsPersonal = ws.type === "PERSONAL";

                return (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-xs font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-6 items-center justify-center rounded-md text-white ${
                          wsIsPersonal ? "bg-emerald-600" : "bg-indigo-600"
                        }`}
                      >
                        {wsIsPersonal ? (
                          <User className="size-3" />
                        ) : (
                          <Building2 className="size-3" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground font-semibold">
                          {ws.name}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {wsIsPersonal ? "Personal" : "Business"}
                        </span>
                      </div>
                    </div>
                    {active && (
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => setIsCreateOpen(true)}
                className="text-foreground hover:bg-accent cursor-pointer gap-2 p-2 text-xs font-medium"
              >
                <div className="border-border bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="text-muted-foreground size-4" />
                </div>
                <div className="text-muted-foreground text-xs font-medium">
                  New Workspace
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                Create New Workspace
              </DialogTitle>
              <DialogDescription>
                Configure a dedicated Personal or Business environment with its
                own accounts and financial tracking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  name="ws-name"
                  placeholder="e.g. Apex Studio, Family Budget, Freelancing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <span className="text-foreground text-sm leading-none font-medium">
                  Workspace Type
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("PERSONAL")}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                      type === "PERSONAL"
                        ? "text-foreground border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                        : "border-border hover:bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-emerald-600" />
                      <span className="text-foreground text-xs font-semibold">
                        Personal
                      </span>
                    </div>
                    <span className="text-[11px] leading-snug">
                      Pockets, personal budgeting & lifestyle expenses.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("BUSINESS")}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                      type === "BUSINESS"
                        ? "text-foreground border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                        : "border-border hover:bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      <span className="text-foreground text-xs font-semibold">
                        Business
                      </span>
                    </div>
                    <span className="text-[11px] leading-snug">
                      Corporate accounts, cash flow, operational expense
                      tracking.
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-curr">Primary Currency</Label>
                <Input
                  id="ws-curr"
                  name="ws-curr"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="INR"
                  maxLength={5}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
