"use server";

import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { db } from "@/server/db";

export interface Budget {
  id: string;
  amount: number;
  category?: string;
  lastAlertSent: Date | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetWithSpending {
  id: string;
  amount: number;
  category: string;
  lastAlertSent: Date | null;
  workspaceId: string;
  currentExpenses: number;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCurrentUserBudgetResponse {
  budget: Budget | null;
  currentExpenses: number;
}

/**
 * Gets the global workspace budget and current month total expenses.
 */
export async function getCurrentBudget(
  workspaceId: string,
  financialAccountId?: string,
): Promise<GetCurrentUserBudgetResponse> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    const budget = await db.budget.findFirst({
      where: {
        workspaceId,
        category: "GLOBAL",
        workspace: { userId: user.id },
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const whereClause: Record<string, unknown> = {
      workspaceId,
      workspace: { userId: user.id },
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (financialAccountId) {
      whereClause.financialAccountId = financialAccountId;
    }

    const expenses = await db.transaction.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget
        ? {
            id: budget.id,
            amount: budget.amount.toNumber(),
            category: budget.category,
            lastAlertSent: budget.lastAlertSent,
            workspaceId: budget.workspaceId,
            createdAt: budget.createdAt,
            updatedAt: budget.updatedAt,
          }
        : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

/**
 * Updates the global monthly spending limit for a workspace.
 */
export async function updateBudget(
  workspaceId: string,
  amount: number,
): Promise<{
  success: boolean;
  data?: Budget;
  error?: string;
}> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    // Verify workspace ownership
    const ws = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });
    if (!ws) throw new Error("Workspace not found");

    const budget = await db.budget.upsert({
      where: {
        workspaceId_category: {
          workspaceId,
          category: "GLOBAL",
        },
      },
      update: { amount },
      create: { workspaceId, amount, category: "GLOBAL" },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    revalidatePath(`/${workspaceId}/budgets`);
    return {
      success: true,
      data: {
        id: budget.id,
        amount: budget.amount.toNumber(),
        category: budget.category,
        lastAlertSent: budget.lastAlertSent,
        workspaceId: budget.workspaceId,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Gets all budgets (global + category) with their current month spending.
 */
export async function getWorkspaceBudgets(
  workspaceId: string,
): Promise<BudgetWithSpending[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) return [];

    const budgets = await db.budget.findMany({
      where: {
        workspaceId,
        workspace: { userId: user.id },
      },
      orderBy: [{ category: "asc" }],
    });

    // Get current month transactions
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );

    const expenseTransactions = await db.transaction.findMany({
      where: {
        workspaceId,
        workspace: { userId: user.id },
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        category: true,
      },
    });

    // Sum by category
    const categorySpending: Record<string, number> = {};
    let totalSpending = 0;

    for (const tx of expenseTransactions) {
      const amt = Number(tx.amount);
      totalSpending += amt;
      const cat = tx.category ?? "other";
      categorySpending[cat] = (categorySpending[cat] ?? 0) + amt;
    }

    return budgets.map((b) => {
      const amt = b.amount.toNumber();
      const currentExpenses =
        b.category === "GLOBAL"
          ? totalSpending
          : (categorySpending[b.category] ?? 0);
      const percentage =
        amt > 0 ? Math.round((currentExpenses / amt) * 100) : 0;

      return {
        id: b.id,
        amount: amt,
        category: b.category,
        lastAlertSent: b.lastAlertSent,
        workspaceId: b.workspaceId,
        currentExpenses,
        percentage,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching workspace budgets:", error);
    return [];
  }
}

/**
 * Upserts a category-specific budget.
 */
export async function setCategoryBudget(
  workspaceId: string,
  category: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    const ws = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });
    if (!ws) throw new Error("Workspace not found");

    await db.budget.upsert({
      where: {
        workspaceId_category: {
          workspaceId,
          category,
        },
      },
      update: { amount },
      create: { workspaceId, category, amount },
    });

    revalidatePath(`/${workspaceId}/budgets`);
    revalidatePath("/[workspaceId]/dashboard", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deletes a category budget.
 */
export async function deleteCategoryBudget(
  workspaceId: string,
  category: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("User not authenticated");

    await db.budget.delete({
      where: {
        workspaceId_category: {
          workspaceId,
          category,
        },
      },
    });

    revalidatePath(`/${workspaceId}/budgets`);
    revalidatePath("/[workspaceId]/dashboard", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
