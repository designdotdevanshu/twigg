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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Check,
  ChevronDown,
  PlusCircle,
  User,
  Building2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [currency, setCurrency] = useState("USD");

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group border-border/80 bg-background/95 hover:border-border hover:bg-accent/40 flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left text-sm font-medium shadow-xs transition focus:outline-hidden"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                isPersonal
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              {isPersonal ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Briefcase className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-foreground max-w-[130px] truncate text-xs leading-tight font-semibold sm:max-w-[180px]">
                {currentWorkspace.name}
              </span>
              <span className="text-muted-foreground text-[10px] leading-tight">
                {isPersonal ? "Personal Mode" : "Business Mode"}
              </span>
            </div>

            <ChevronDown className="text-muted-foreground group-hover:text-foreground ml-1 h-3.5 w-3.5 transition" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-lg">
          <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[11px] font-medium tracking-wider uppercase">
            Workspaces & Modes
          </DropdownMenuLabel>

          <div className="space-y-1">
            {workspaces.map((ws) => {
              const active = ws.id === currentWorkspace.id;
              const wsIsPersonal = ws.type === "PERSONAL";

              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => switchWorkspace(ws.id)}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-sm ${
                        wsIsPersonal
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {wsIsPersonal ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Building2 className="h-3 w-3" />
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

                  {active && <Check className="text-foreground h-4 w-4" />}
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem
            onClick={() => setIsCreateOpen(true)}
            className="text-foreground hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs font-medium"
          >
            <PlusCircle className="text-muted-foreground h-4 w-4" />
            <span>New Workspace / Mode</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
                  placeholder="e.g. Apex Studio, Family Budget, Freelancing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <span className="text-foreground text-sm leading-none font-medium">
                  Finance Experience Mode
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
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
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
