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
          currency: "INR",
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
        currency: parsed.currency ?? "INR",
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
 * Updates an existing Workspace (name, currency, type).
 */
export async function updateWorkspace(
  workspaceId: string,
  input: Partial<WorkspaceInput>,
): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });
    if (!workspace) throw new Error("Workspace not found");

    const updated = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.type ? { type: input.type } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/[workspaceId]", "layout");
    revalidatePath(`/${workspaceId}/dashboard`);
    revalidatePath(`/${workspaceId}/settings`);

    return { success: true, data: serializeDecimal(updated) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deletes a workspace (preventing deletion of the last remaining workspace).
 */
export async function deleteWorkspace(
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const count = await db.workspace.count({
      where: { userId: user.id },
    });
    if (count <= 1) {
      throw new Error("Cannot delete your only workspace");
    }

    const ws = await db.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });
    if (!ws) throw new Error("Workspace not found");

    await db.workspace.delete({
      where: { id: workspaceId },
    });

    // If deleting the default workspace, pick another one as default
    if (ws.isDefault) {
      const another = await db.workspace.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
      if (another) {
        await db.workspace.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates the user's profile details.
 */
export async function updateUserProfile(input: {
  name?: string;
  image?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    await db.user.update({
      where: { id: user.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/[workspaceId]", "layout");
    return { success: true };
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
