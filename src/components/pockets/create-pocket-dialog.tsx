"use client";

import React, { useState } from "react";
import { createPocket } from "@/actions/pocket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Layers, Plus } from "lucide-react";

const SUGGESTED_POCKETS = [
  { name: "Groceries", color: "#10b981" },
  { name: "Rent & Living", color: "#6366f1" },
  { name: "Commute & Fuel", color: "#f59e0b" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Emergency Fund", color: "#0ea5e9" },
  { name: "Vacation / Travel", color: "#8b5cf6" },
];

const COLOR_PALETTE = [
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

interface CreatePocketDialogProps {
  accounts: { id: string; name: string }[];
  defaultAccountId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePocketDialog({
  accounts,
  defaultAccountId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreatePocketDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [accountId, setAccountId] = useState(
    defaultAccountId ?? accounts[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]!);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync accountId if accounts change and nothing is selected
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(defaultAccountId ?? accounts[0]?.id ?? "");
    }
  }, [accounts, defaultAccountId, accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for this pocket");
      return;
    }
    if (!accountId) {
      toast.error("Please select a parent financial account");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPocket({
        name: name.trim(),
        description: description.trim() || undefined,
        financialAccountId: accountId,
        goalAmount: goalAmount ? goalAmount : undefined,
        color: selectedColor,
      });

      if (res.success) {
        toast.success(`Pocket "${name}" created successfully`);
        setName("");
        setDescription("");
        setGoalAmount("");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Failed to create pocket");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestion = (suggestion: { name: string; color: string }) => {
    setName(suggestion.name);
    setSelectedColor(suggestion.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Pocket
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="text-primary h-5 w-5" />
              Create a Pocket
            </DialogTitle>
            <DialogDescription>
              A pocket is a dedicated purpose or budgeting container inside an
              account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Suggestions */}
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Quick Suggestions
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SUGGESTED_POCKETS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="border-border/80 bg-background text-foreground hover:border-foreground/40 hover:bg-accent flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Parent Account */}
            <div className="space-y-1.5">
              <Label htmlFor="parent-account">Parent Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="parent-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pocket Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pocket-name">Pocket Name</Label>
              <Input
                id="pocket-name"
                placeholder="e.g. Groceries, Rent, Emergency Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Target Goal (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="pocket-goal">
                Goal / Allocation Target (Optional)
              </Label>
              <Input
                id="pocket-goal"
                type="number"
                step="0.01"
                placeholder="e.g. 500.00"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Color Swatch */}
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">
                Color Identifier
              </p>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      selectedColor === color
                        ? "ring-primary scale-125 ring-2 ring-offset-2"
                        : "opacity-80 hover:scale-110 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Pocket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
