/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Centralized error handler
export function handleError(error: unknown): never {
  const message =
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  console.error("Error:", message, error);
  throw new Error(message);
}

// Wrapper to catch async errors
export async function asyncHandler<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error);
  }
}

// Serialize Prisma Decimal fields (safe copy)
export function serializeDecimal<T extends Record<string, any>>(obj: T): T {
  const serialized: any = { ...obj };

  if ("balance" in obj && obj.balance?.toNumber) {
    serialized.balance = obj.balance.toNumber();
  }
  if ("amount" in obj && obj.amount?.toNumber) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
}
