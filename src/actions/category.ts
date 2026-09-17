"use server";

import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth";
import { db } from "@/server/db";
import { defaultCategories, type Category } from "@/data/categories";

export interface UnifiedCategory extends Category {
  isCustom?: boolean;
}

/**
 * Returns merged predefined and workspace custom categories.
 */
export async function getWorkspaceCategories(
  workspaceId: string,
): Promise<UnifiedCategory[]> {
  try {
    const user = await getUserSession();
    if (!user?.id) return defaultCategories;

    const custom = await db.customCategory.findMany({
      where: {
        workspaceId,
        workspace: { userId: user.id },
      },
      orderBy: { createdAt: "asc" },
    });

    const mappedCustom: UnifiedCategory[] = custom.map((c) => ({
      id: c.name.toLowerCase().replace(/\s+/g, "-"),
      name: c.name,
      type: c.type,
      color: c.color ?? "#06b6d4",
      icon: c.icon ?? "Tag",
      isCustom: true,
    }));

    return [...defaultCategories, ...mappedCustom];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return defaultCategories;
  }
}

/**
 * Creates a custom category in a workspace.
 */
export async function createCustomCategory(input: {
  workspaceId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string;
  icon?: string;
}): Promise<{ success: boolean; data?: UnifiedCategory; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    const ws = await db.workspace.findFirst({
      where: { id: input.workspaceId, userId: user.id },
    });
    if (!ws) throw new Error("Workspace not found");

    const created = await db.customCategory.create({
      data: {
        name: input.name.trim(),
        type: input.type,
        color: input.color ?? "#06b6d4",
        icon: input.icon ?? "Tag",
        workspaceId: input.workspaceId,
      },
    });

    revalidatePath(`/${input.workspaceId}/settings`);

    return {
      success: true,
      data: {
        id: created.name.toLowerCase().replace(/\s+/g, "-"),
        name: created.name,
        type: created.type,
        color: created.color ?? "#06b6d4",
        icon: created.icon ?? "Tag",
        isCustom: true,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deletes a custom category.
 */
export async function deleteCustomCategory(
  categoryId: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserSession();
    if (!user?.id) throw new Error("Unauthorized");

    await db.customCategory.delete({
      where: { id: categoryId, workspaceId },
    });

    revalidatePath(`/${workspaceId}/settings`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
