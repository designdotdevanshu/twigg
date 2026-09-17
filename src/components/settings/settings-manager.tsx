"use client";

import * as React from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateWorkspace,
  deleteWorkspace,
  updateUserProfile,
} from "@/actions/workspace";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  CreditCard,
  Moon,
  Sun,
  Laptop,
  Bell,
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface SettingsManagerProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const POPULAR_CURRENCIES = [
  { code: "INR", name: "Indian Rupee (₹)", symbol: "₹" },
  { code: "USD", name: "US Dollar ($)", symbol: "$" },
  { code: "EUR", name: "Euro (€)", symbol: "€" },
  { code: "GBP", name: "British Pound (£)", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar (C$)", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar (A$)", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar (S$)", symbol: "S$" },
  { code: "AED", name: "UAE Dirham (AED)", symbol: "AED" },
];

export function SettingsManager({ user }: SettingsManagerProps) {
  const router = useRouter();
  const { currentWorkspace, workspaces } = useWorkspace();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [userName, setUserName] = useState(user.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Workspace preferences state
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace.name);
  const [currency, setCurrency] = useState(currentWorkspace.currency || "INR");
  const [workspaceType, setWorkspaceType] = useState<"PERSONAL" | "BUSINESS">(
    currentWorkspace.type,
  );
  const [savingWs, setSavingWs] = useState(false);

  // Notification preferences mock
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [unusualSpending, setUnusualSpending] = useState(true);

  // Danger zone state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingWs, setDeletingWs] = useState(false);

  // Handle saving user profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateUserProfile({ name: userName.trim() });
      if (res.success) {
        toast.success("Profile details updated");
      } else {
        toast.error(res.error ?? "Failed to update profile");
      }
    } catch {
      toast.error("Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle saving workspace preferences
  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }

    setSavingWs(true);
    try {
      const res = await updateWorkspace(currentWorkspace.id, {
        name: workspaceName.trim(),
        currency: currency.trim(),
        type: workspaceType,
      });

      if (res.success) {
        toast.success("Workspace preferences updated");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to update workspace");
      }
    } catch {
      toast.error("Error saving preferences");
    } finally {
      setSavingWs(false);
    }
  };

  // Handle deleting current workspace
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== currentWorkspace.name) {
      toast.error("Workspace name confirmation does not match");
      return;
    }

    setDeletingWs(true);
    try {
      const res = await deleteWorkspace(currentWorkspace.id);
      if (res.success) {
        toast.success("Workspace deleted");
        router.push("/");
      } else {
        toast.error(res.error ?? "Failed to delete workspace");
      }
    } catch {
      toast.error("Error deleting workspace");
    } finally {
      setDeletingWs(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* 1. Profile Section */}
      <Card className="border-border/80 shadow-xs">
        <form onSubmit={handleSaveProfile}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-emerald-500" />
              Personal Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your personal identity, avatar, and authentication details.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="border-border h-16 w-16 border">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-emerald-500/20 text-xl font-bold text-emerald-400">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-foreground text-sm font-semibold">
                  {user.name ?? "Your Account"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {user.email ?? ""}
                </p>
                <span className="mt-1 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Verified Identity
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-name" className="text-xs">
                  Display Name
                </Label>
                <Input
                  id="user-name"
                  name="user-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="h-9 text-xs"
                  disabled={savingProfile}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-xs">
                  Email Address
                </Label>
                <Input
                  id="user-email"
                  name="user-email"
                  value={user.email ?? ""}
                  disabled
                  className="bg-muted/50 h-9 cursor-not-allowed text-xs"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-border/80 flex justify-end border-t px-6 py-3">
            <Button
              type="submit"
              size="sm"
              disabled={savingProfile}
              className="text-xs font-semibold"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* 2. Workspace & Currency Preferences */}
      <Card className="border-border/80 shadow-xs">
        <form onSubmit={handleSaveWorkspace}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Workspace & Currency Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Configure active currency, workspace name, and operational mode
              for{" "}
              <span className="text-foreground font-semibold">
                {currentWorkspace.name}
              </span>
              .
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ws-name-input" className="text-xs">
                  Workspace Name
                </Label>
                <Input
                  id="ws-name-input"
                  name="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-9 text-xs"
                  disabled={savingWs}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ws-currency-select" className="text-xs">
                  Primary Currency
                </Label>
                <Select
                  name="currency"
                  value={currency}
                  onValueChange={(val) => setCurrency(val)}
                  disabled={savingWs}
                >
                  <SelectTrigger
                    id="ws-currency-select"
                    aria-label="Primary Currency"
                    className="h-9 text-xs"
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CURRENCIES.map((c) => (
                      <SelectItem
                        key={c.code}
                        value={c.code}
                        className="text-xs"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label className="text-xs">Workspace Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWorkspaceType("PERSONAL")}
                  className={`rounded-lg border p-3 text-left transition ${
                    workspaceType === "PERSONAL"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500"
                      : "border-border hover:bg-accent/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-foreground block text-xs font-semibold">
                    Personal Mode
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Enables Pockets, lifestyle categories & personal budgeting.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceType("BUSINESS")}
                  className={`rounded-lg border p-3 text-left transition ${
                    workspaceType === "BUSINESS"
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500"
                      : "border-border hover:bg-accent/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-foreground block text-xs font-semibold">
                    Business Mode
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Enables cash burn tracking, runway metrics & operational
                    cost centers.
                  </span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-border/80 flex justify-end border-t px-6 py-3">
            <Button
              type="submit"
              size="sm"
              disabled={savingWs}
              className="bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              {savingWs ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* 3. Appearance & Theme */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sun className="h-4 w-4 text-emerald-500" />
            Theme & Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Twigg is built dark-first. You can toggle content appearance based
            on your preference.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition ${
                theme === "dark"
                  ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-500 ring-1 ring-emerald-500"
                  : "border-border hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <Moon className="h-5 w-5 text-emerald-400" />
              <span>Dark (Default)</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition ${
                theme === "light"
                  ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-500 ring-1 ring-emerald-500"
                  : "border-border hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition ${
                theme === "system"
                  ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-500 ring-1 ring-emerald-500"
                  : "border-border hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <Laptop className="h-5 w-5 text-indigo-400" />
              <span>System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Notification Preferences */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 text-emerald-500" />
            Notification & Alert Rules
          </CardTitle>
          <CardDescription className="text-xs">
            Configure how and when Twigg sends budget warnings and transaction
            digests.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="budget-alerts"
                className="cursor-pointer text-xs font-semibold"
              >
                Budget Threshold Alert
              </Label>
              <p className="text-muted-foreground text-[11px]">
                Alert when monthly expenses exceed 85% of configured limit
              </p>
            </div>
            <Switch
              id="budget-alerts"
              checked={budgetAlerts}
              onCheckedChange={setBudgetAlerts}
            />
          </div>

          <div className="border-border/60 flex items-center justify-between border-t pt-2">
            <div className="space-y-0.5">
              <Label
                htmlFor="weekly-digest"
                className="cursor-pointer text-xs font-semibold"
              >
                Weekly Spending Summary
              </Label>
              <p className="text-muted-foreground text-[11px]">
                Receive weekly summary of highest expense categories
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>

          <div className="border-border/60 flex items-center justify-between border-t pt-2">
            <div className="space-y-0.5">
              <Label
                htmlFor="unusual-spending"
                className="cursor-pointer text-xs font-semibold"
              >
                Large Transaction Warnings
              </Label>
              <p className="text-muted-foreground text-[11px]">
                Highlight single transactions that exceed ₹10,000 / $150
              </p>
            </div>
            <Switch
              id="unusual-spending"
              checked={unusualSpending}
              onCheckedChange={setUnusualSpending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Danger Zone: Delete Workspace */}
      <Card className="border-rose-500/30 bg-rose-500/5 shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently delete this workspace, including all associated
            accounts, transactions, pockets, and budgets.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-foreground text-xs font-semibold">
                Delete &ldquo;{currentWorkspace.name}&rdquo;
              </p>
              <p className="text-muted-foreground text-[11px]">
                {workspaces.length <= 1
                  ? "You cannot delete your only active workspace."
                  : "This action cannot be undone. All data in this workspace will be deleted."}
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={workspaces.length <= 1}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                    Permanently Delete Workspace?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-xs">
                    <span>
                      This will irreversibly delete{" "}
                      <strong>{currentWorkspace.name}</strong> and all linked
                      accounts and transactions.
                    </span>
                    <span className="block pt-2">
                      Please type <strong>{currentWorkspace.name}</strong> below
                      to confirm:
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-1 py-2">
                  <Label htmlFor="delete-workspace-confirm" className="sr-only">
                    Confirm workspace deletion
                  </Label>
                  <Input
                    id="delete-workspace-confirm"
                    name="delete-workspace-confirm"
                    aria-label="Confirm workspace deletion by typing workspace name"
                    placeholder={currentWorkspace.name}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteWorkspace}
                    disabled={
                      deleteConfirmText !== currentWorkspace.name || deletingWs
                    }
                    className="bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    {deletingWs ? "Deleting..." : "Permanently Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
