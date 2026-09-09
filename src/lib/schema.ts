import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50),
  type: z.enum(["PERSONAL", "BUSINESS"]),
  currency: z.string().optional(),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean(),
});

export type AccountInput = z.infer<typeof accountSchema>;

export const pocketSchema = z.object({
  name: z.string().min(1, "Pocket name is required"),
  description: z.string().optional(),
  goalAmount: z.string().optional(),
  financialAccountId: z.string().min(1, "Account is required"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type PocketInput = z.infer<typeof pocketSchema>;

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().optional(),
    date: z.date({ message: "Date is required" }),
    financialAccountId: z.string().min(1, "Account is required"),
    pocketId: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean(),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
