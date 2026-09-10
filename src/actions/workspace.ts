"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { getUserSession } from "@/lib/auth";
import { handleError, serializeDecimal } from "@/lib/utils";
import { workspaceSchema, type WorkspaceInput } from "@/lib/schema";
import type { Workspace } from "@prisma/client";

export type WorkspaceWithMeta = Workspace & {
  _count?: {
    financialAccounts: number;
    transactions: number;
  };
};

/**
 * Retrieves all workspaces for the authenticated user.
 * If user has no workspaces, automatically initializes a default "Personal" workspace.
 */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    let workspaces = await db.workspace.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    if (workspaces.length === 0) {
      // Auto-provision initial Personal workspace
      const defaultWorkspace = await db.workspace.create({
        data: {
          name: "Personal",
          type: "PERSONAL",
          currency: "USD",
          isDefault: true,
          userId: user.id,
        },
      });
      workspaces = [defaultWorkspace];
    }

    return workspaces.map(serializeDecimal);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Gets a specific workspace ensuring ownership.
 */
export async function getWorkspace(
  workspaceId: string,
): Promise<Workspace | null> {
  try {
    const user = await getUserSession();
    if (!user?.id) return null;

    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) return null;
    return serializeDecimal(workspace);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Creates a new Workspace (Personal or Business).
 */
export async function createWorkspace(
  input: WorkspaceInput,
): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const parsed = workspaceSchema.parse(input);

    const existingCount = await db.workspace.count({
      where: { userId: user.id },
    });

    const isFirst = existingCount === 0;

    const created = await db.workspace.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        currency: parsed.currency ?? "USD",
        isDefault: isFirst,
        userId: user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/[workspaceId]", "layout");

    return { success: true, data: serializeDecimal(created) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Sets the default workspace for the user.
 */
export async function setDefaultWorkspace(
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    await db.$transaction([
      db.workspace.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      }),
      db.workspace.update({
        where: { id: workspaceId, userId: user.id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
