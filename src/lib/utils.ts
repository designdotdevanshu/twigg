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

// Deeply serialize Prisma Decimal fields (safe copy for Next.js Flight/RSC)
export function serializeDecimal<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Check for Prisma Decimal or any Decimal-like object with toNumber()
  if (
    typeof data === "object" &&
    data !== null &&
    "toNumber" in (data as any) &&
    typeof (data as any).toNumber === "function"
  ) {
    return (data as any).toNumber();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeDecimal(item)) as unknown as T;
  }

  // Preserve Dates
  if (data instanceof Date) {
    return data;
  }

  // Handle plain objects
  if (typeof data === "object") {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDecimal(value);
    }
    return serialized as T;
  }

  return data;
}

export { formatCurrency } from "./constant";
