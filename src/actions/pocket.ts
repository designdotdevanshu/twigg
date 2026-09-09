"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getUserSession } from "@/lib/auth";
import { handleError, serializeDecimal } from "@/lib/utils";
import { pocketSchema, type PocketInput } from "@/lib/schema";
import type { Pocket } from "@prisma/client";

export type PocketWithMeta = Pocket & {
  _count?: {
    transactions: number;
  };
  financialAccount?: {
    id: string;
    name: string;
  };
};

/**
 * Gets all pockets for a given financial account.
 */
export async function getPocketsByAccount(
  financialAccountId: string,
): Promise<PocketWithMeta[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) return [];

    // Verify account belongs to a workspace owned by the user
    const account = await db.financialAccount.findFirst({
      where: {
        id: financialAccountId,
        workspace: { userId: user.id },
      },
    });

    if (!account) return [];

    const pockets = await db.pocket.findMany({
      where: { financialAccountId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return pockets.map(serializeDecimal);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Gets all pockets across all accounts in a workspace (used for personal dashboard view).
 */
export async function getWorkspacePockets(
  workspaceId: string,
): Promise<PocketWithMeta[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) return [];

    const pockets = await db.pocket.findMany({
      where: {
        financialAccount: {
          workspaceId,
          workspace: { userId: user.id },
        },
      },
      include: {
        financialAccount: {
          select: { id: true, name: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return pockets.map(serializeDecimal);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Creates a new pocket within an account.
 */
export async function createPocket(
  input: PocketInput,
): Promise<{ success: boolean; data?: Pocket; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const parsed = pocketSchema.parse(input);

    // Verify account ownership
    const account = await db.financialAccount.findFirst({
      where: {
        id: parsed.financialAccountId,
        workspace: { userId: user.id },
      },
    });

    if (!account) throw new Error("Account not found or access denied");

    const goalDecimal = parsed.goalAmount ? Number(parsed.goalAmount) : null;

    const pocket = await db.pocket.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        goalAmount: goalDecimal,
        financialAccountId: parsed.financialAccountId,
        color: parsed.color ?? "#0ea5e9", // default sky-500
        icon: parsed.icon ?? "piggy-bank",
        currentBalance: 0,
      },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    revalidatePath("/[workspaceId]/account/[id]", "page");

    return { success: true, data: serializeDecimal(pocket) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates a pocket's details.
 */
export async function updatePocket(
  id: string,
  data: Partial<PocketInput>,
): Promise<{ success: boolean; data?: Pocket; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const existing = await db.pocket.findFirst({
      where: {
        id,
        financialAccount: { workspace: { userId: user.id } },
      },
    });

    if (!existing) throw new Error("Pocket not found");

    const updated = await db.pocket.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.goalAmount !== undefined && {
          goalAmount: data.goalAmount ? Number(data.goalAmount) : null,
        }),
        ...(data.color && { color: data.color }),
        ...(data.icon && { icon: data.icon }),
      },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    revalidatePath("/[workspaceId]/account/[id]", "page");

    return { success: true, data: serializeDecimal(updated) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deletes a pocket. Transactions in this pocket will remain in the account but unassigned to any pocket.
 */
export async function deletePocket(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const existing = await db.pocket.findFirst({
      where: {
        id,
        financialAccount: { workspace: { userId: user.id } },
      },
    });

    if (!existing) throw new Error("Pocket not found");

    await db.pocket.delete({
      where: { id },
    });

    revalidatePath("/[workspaceId]/dashboard", "page");
    revalidatePath("/[workspaceId]/account/[id]", "page");

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
