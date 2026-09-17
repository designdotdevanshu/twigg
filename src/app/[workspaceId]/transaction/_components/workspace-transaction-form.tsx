"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Layers } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import {
  createTransaction,
  type Transaction,
  updateTransaction,
} from "@/actions/transaction";
import { transactionSchema } from "@/lib/schema";
import type { FinancialAccountWithRelations } from "@/actions/dashboard";
import type { Category } from "@/data/categories";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormDescription,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReceiptScanner } from "@/components/transactions/receipt-scanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { CreatePocketDialog } from "@/components/pockets/create-pocket-dialog";

type WorkspaceTransactionFormProps = {
  workspaceId: string;
  accounts: FinancialAccountWithRelations[];
  categories: Category[];
  editId?: string | null;
  editMode?: boolean;
  initialData?: Transaction | null;
};

export function WorkspaceTransactionForm({
  workspaceId,
  accounts,
  categories,
  editId = null,
  editMode = false,
  initialData = null,
}: WorkspaceTransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAccount = accounts.find((ac) => ac.isDefault) ?? accounts[0];

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description ?? "",
            financialAccountId: initialData.financialAccountId,
            pocketId: initialData.pocketId ?? "NONE",
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE" as const,
            amount: "",
            description: "",
            financialAccountId: defaultAccount?.id ?? "",
            pocketId: "NONE",
            category: "",
            date: new Date(),
            isRecurring: false,
            recurringInterval: "MONTHLY" as const,
          },
  });

  const selectedAccountId = form.watch("financialAccountId");
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const availablePockets = selectedAccount?.pockets ?? [];

  const handleReceiptScan = (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
  }) => {
    form.setValue("amount", data.amount.toString());
    form.setValue("date", new Date(data.date));
    form.setValue("description", data.description);

    const matchingCat = categories.find(
      (c) =>
        c.id.toLowerCase() === data.category.toLowerCase() ||
        c.name.toLowerCase() === data.category.toLowerCase(),
    );
    if (matchingCat) {
      form.setValue("category", matchingCat.id);
    }
  };

  const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
    setIsSubmitting(true);
    try {
      const pocketIdValue =
        data.pocketId && data.pocketId !== "NONE" ? data.pocketId : null;

      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        pocketId: pocketIdValue,
      };

      if (editMode && editId) {
        await updateTransaction(editId, payload);
        toast.success("Transaction updated successfully");
      } else {
        await createTransaction(payload);
        toast.success("Transaction recorded successfully");
      }

      router.push(`/${workspaceId}/dashboard`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to save transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardContent className="p-6 sm:p-8">
        {!editMode && (
          <div className="border-border/60 mb-6 border-b pb-6">
            <ReceiptScanner onScanComplete={handleReceiptScan} />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type selector (Expense vs Income) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <span className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                    Transaction Type
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => field.onChange("EXPENSE")}
                      className={cn(
                        "flex items-center justify-center rounded-lg border py-2.5 text-xs font-semibold transition",
                        field.value === "EXPENSE"
                          ? "border-rose-500 bg-rose-500/10 text-rose-600 ring-1 ring-rose-500 dark:text-rose-400"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("INCOME")}
                      className={cn(
                        "flex items-center justify-center rounded-lg border py-2.5 text-xs font-semibold transition",
                        field.value === "INCOME"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500 dark:text-emerald-400"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      Income
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount & Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="tx-amount">Amount</FormLabel>
                    <FormControl>
                      <Input
                        id="tx-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="text-base font-medium"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <span className="text-foreground block text-sm leading-none font-medium">
                      Date
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Account & Pocket Selector */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Financial Account */}
              <FormField
                control={form.control}
                name="financialAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="tx-account">
                      Financial Account
                    </FormLabel>
                    <Select
                      name="financialAccountId"
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Reset pocketId to NONE if account changes
                        form.setValue("pocketId", "NONE");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="tx-account" className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({formatCurrency(Number(acc.balance))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pocket / Allocation Selector */}
              <FormField
                control={form.control}
                name="pocketId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel
                        htmlFor="tx-pocket"
                        className="flex items-center gap-1.5"
                      >
                        <Layers className="text-primary h-3.5 w-3.5" />
                        Pocket Allocation
                      </FormLabel>
                      {selectedAccountId && (
                        <CreatePocketDialog
                          accounts={accounts}
                          defaultAccountId={selectedAccountId}
                          trigger={
                            <span className="text-primary cursor-pointer text-[11px] hover:underline">
                              + New Pocket
                            </span>
                          }
                        />
                      )}
                    </div>
                    <Select
                      name="pocketId"
                      onValueChange={field.onChange}
                      value={field.value ?? "NONE"}
                    >
                      <FormControl>
                        <SelectTrigger id="tx-pocket" className="w-full">
                          <SelectValue placeholder="Direct Account (No Pocket)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">
                          <span className="text-muted-foreground">
                            Direct Account (No Pocket)
                          </span>
                        </SelectItem>
                        {availablePockets.map((pocket) => (
                          <SelectItem key={pocket.id} value={pocket.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: pocket.color ?? "#0ea5e9",
                                }}
                              />
                              <span>{pocket.name}</span>
                              <span className="text-muted-foreground text-[11px]">
                                ({formatCurrency(Number(pocket.currentBalance))}
                                )
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px]">
                      Associate with a dedicated Pocket (e.g. Groceries) or
                      leave as direct.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tx-category">Category</FormLabel>
                  <Select
                    name="category"
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="tx-category" className="w-full">
                        <SelectValue placeholder="Select spending category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tx-description">
                    Description / Merchant (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="tx-description"
                      placeholder="e.g. Whole Foods Groceries, Client Retainer, Uber ride"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Option */}
            <div className="border-border/80 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-foreground block text-sm font-medium">
                    Recurring Transaction
                  </span>
                  <FormDescription className="text-xs">
                    Automatically record this transaction periodically
                  </FormDescription>
                </div>
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          id="recurring-switch"
                          aria-label="Recurring transaction"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? "MONTHLY"}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${workspaceId}/dashboard`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={16} />
                    <span>Saving...</span>
                  </>
                ) : editMode ? (
                  "Update Transaction"
                ) : (
                  "Record Transaction"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
