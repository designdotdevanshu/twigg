"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { updateWorkspace } from "@/actions/workspace";
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
import { Sparkles, IndianRupee, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface OnboardingModalProps {
  userId: string;
}

export function OnboardingModal({ userId }: OnboardingModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace.name);
  const [currency, setCurrency] = useState(currentWorkspace.currency || "INR");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const key = `twigg_onboarded_${userId}`;
      const hasOnboarded = localStorage.getItem(key);
      if (!hasOnboarded) {
        setIsOpen(true);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (
        workspaceName !== currentWorkspace.name ||
        currency !== currentWorkspace.currency
      ) {
        await updateWorkspace(currentWorkspace.id, {
          name: workspaceName.trim() || currentWorkspace.name,
          currency: currency.trim() || "INR",
        });
      }

      localStorage.setItem(`twigg_onboarded_${userId}`, "true");
      setIsOpen(false);
      toast.success("Welcome to Twigg! Your workspace is ready.");
    } catch {
      toast.error("Error saving preferences");
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(`twigg_onboarded_${userId}`, "true");
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Welcome to Twigg
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-xs">
            Let&apos;s personalize your financial workspace in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-name" className="text-xs">
              Workspace Name
            </Label>
            <Input
              id="ob-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. My Finances"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ob-currency" className="text-xs">
              Default Currency
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { code: "INR", symbol: "₹", name: "Indian Rupee" },
                { code: "USD", symbol: "$", name: "US Dollar" },
                { code: "EUR", symbol: "€", name: "Euro" },
                { code: "GBP", symbol: "£", name: "British Pound" },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs transition ${
                    currency === c.code
                      ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 ring-1 ring-emerald-500 dark:text-emerald-400"
                      : "border-border hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-sm font-bold">{c.symbol}</span>
                  <span className="mt-0.5 text-[10px]">{c.code}</span>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
              <IndianRupee className="h-3 w-3 text-emerald-500" />
              INR is selected by default for Indian accounts.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Skip for now
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleComplete}
            disabled={saving}
            className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <span>{saving ? "Setting up..." : "Get Started"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
