"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { db } from "@/server/db";
import {
  Prisma,
  RecurringInterval,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { getUserSession } from "@/lib/auth";
import { env } from "@/env";

/* ----------------------------- CONFIG -------------------------------- */

const { GEMINI_API_KEY, GEMINI_MODEL_PRIMARY, GEMINI_MODEL_FALLBACK } = env;
if (!GEMINI_API_KEY && GEMINI_API_KEY === undefined) {
  // fallback guard for weird env resolution - keep original error messaging
}
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const PRIMARY_MODEL = GEMINI_MODEL_PRIMARY ?? "gemini-2.0-flash-lite";
const FALLBACK_MODEL = GEMINI_MODEL_FALLBACK ?? "gemini-2.0-flash";
const AI = new GoogleGenerativeAI(GEMINI_API_KEY);

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

/* ----------------------------- TYPES -------------------------------- */

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: Date;
  category: string;
  receiptUrl: string | null;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  nextRecurringDate: Date | null;
  lastProcessed: Date | null;
  status: TransactionStatus;
  userId: string;
  financialAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionResponse {
  success: boolean;
  data: Transaction;
}

type DecimalLike = Prisma.Decimal | number | string;

/* ----------------------------- ZOD SCHEMAS -------------------------- */

const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  financialAccountId: z.string().min(1),
  amount: z.number().finite(),
  description: z.string().nullable().optional(),
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
  category: z.string().min(1),
  receiptUrl: z.string().url().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).nullable().optional(),
  status: z.nativeEnum(TransactionStatus).default("PENDING"),
});

const updateTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  financialAccountId: z.string().min(1),
  amount: z.number().finite(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).nullable().optional(),
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
  description: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
  receiptUrl: z.string().url().nullable().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export type GetUserTransactionsParams = {
  financialAccountId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  from?: Date | string;
  to?: Date | string;
  page?: number;
  pageSize?: number; // default 20
};

/* ----------------------------- UTIL HELPERS ------------------------- */

function toDecimal(v: DecimalLike): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

/** Safely serialize nested Prisma.Decimal -> number and keep Date as Date for consumer code. */
function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj as unknown as T;
  if (obj instanceof Prisma.Decimal) return obj.toNumber() as unknown as T;

  if (Array.isArray(obj)) {
    return obj.map((v) => serializeDecimals(v)) as unknown as T;
  }

  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = serializeDecimals(v as T);
    }
    return out as T;
  }

  return obj;
}

function signAmount(type: TransactionType, amount: number): Prisma.Decimal {
  const dec = toDecimal(amount);
  return type === "EXPENSE" ? dec.mul(-1) : dec;
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

/** Calculate the next recurring date from startDate given interval. Pure and testable. */
function calculateNextRecurringDate(
  startDate: Date,
  interval: RecurringInterval,
): Date {
  const d = new Date(startDate);
  switch (interval) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY":
      // keep same day of month semantics; Date will auto-carry if invalid
      d.setMonth(d.getMonth() + 1);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

/* ----------------------------- DB HELPERS --------------------------- */

/**
 * Throws if the financial account is not owned by the user.
 * Accepts an optional tx client to be used inside transactions.
 */
async function ensureAccountOwnedByUser(
  accountId: string,
  userId: string,
  tx: Prisma.TransactionClient = db,
) {
  const fa = await tx.financialAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  assert(fa, "FinancialAccount not found");
}

/**
 * Adjust account balance using an atomic update. Accepts a Prisma.Decimal delta.
 * Keeps the single responsibility of balance updates in one place.
 */
async function adjustAccountBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  delta: Prisma.Decimal,
) {
  await tx.financialAccount.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  });
}

/* ----------------------------- ACTIONS ------------------------------ */

/** Create Transaction (race-safe balance update; computes nextRecurringDate). */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<TransactionResponse> {
  const parsed = createTransactionSchema.parse(input);
  const { id: userId } = await getUserSession();

  // Ensure account belongs to user
  await ensureAccountOwnedByUser(parsed.financialAccountId, userId);

  const balanceChange = signAmount(parsed.type, parsed.amount);

  const created = await db.$transaction(async (tx) => {
    const nextRecurring =
      parsed.isRecurring && parsed.recurringInterval
        ? calculateNextRecurringDate(
            new Date(parsed.date),
            parsed.recurringInterval,
          )
        : null;

    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        type: parsed.type,
        financialAccountId: parsed.financialAccountId,
        amount: toDecimal(parsed.amount),
        description: parsed.description ?? null,
        date: new Date(parsed.date),
        category: parsed.category,
        receiptUrl: parsed.receiptUrl ?? null,
        isRecurring: parsed.isRecurring,
        recurringInterval: parsed.recurringInterval ?? null,
        nextRecurringDate: nextRecurring,
        status: parsed.status,
      },
    });

    // Increment account balance atomically without a prior read
    await adjustAccountBalance(tx, parsed.financialAccountId, balanceChange);

    return newTransaction;
  });

  // revalidate relevant pages
  revalidatePath("/dashboard");
  revalidatePath(`/financialAccount/${created.financialAccountId}`);

  return {
    success: true,
    data: serializeDecimals(created) as unknown as Transaction,
  };
}

/** Get single transaction, scoped to user. */
export async function getTransaction(id: string): Promise<Transaction | null> {
  const { id: userId } = await getUserSession();

  const tx = await db.transaction.findFirst({
    where: { id, userId },
  });
  assert(tx, "Transaction not found");

  return serializeDecimals(tx) as unknown as Transaction;
}

/** Update transaction with correct balance adjustments (handles account moves). */
export async function updateTransaction(
  id: string,
  payload: UpdateTransactionInput,
): Promise<TransactionResponse> {
  const data = updateTransactionSchema.parse(payload);
  const { id: userId } = await getUserSession();

  const updatedTx = await db.$transaction(async (tx) => {
    const original = await tx.transaction.findFirst({
      where: { id, userId },
      include: { financialAccount: { select: { id: true } } },
    });
    assert(original, "Transaction not found");

    // Ensure target account is owned by user
    await ensureAccountOwnedByUser(data.financialAccountId, userId, tx);

    const oldChange = signAmount(original.type, original.amount.toNumber());
    const newChange = signAmount(data.type, data.amount);

    const nextRecurring =
      data.isRecurring && data.recurringInterval
        ? calculateNextRecurringDate(
            new Date(data.date),
            data.recurringInterval,
          )
        : null;

    // Update transaction row first
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        type: data.type,
        financialAccountId: data.financialAccountId,
        amount: toDecimal(data.amount),
        isRecurring: data.isRecurring,
        recurringInterval: data.recurringInterval ?? null,
        date: new Date(data.date),
        nextRecurringDate: nextRecurring,
        description: data.description ?? original.description,
        category: data.category ?? original.category,
        receiptUrl: data.receiptUrl ?? original.receiptUrl,
        status: data.status ?? original.status,
      },
    });

    const accountChanged =
      original.financialAccountId !== data.financialAccountId;

    if (accountChanged) {
      // Reverse original impact on old account
      await adjustAccountBalance(
        tx,
        original.financialAccountId,
        oldChange.mul(-1),
      );
      // Apply new impact on new account
      await adjustAccountBalance(tx, data.financialAccountId, newChange);
    } else {
      // Same account: apply delta
      const delta = newChange.sub(oldChange);
      if (!delta.eq(0)) {
        await adjustAccountBalance(tx, data.financialAccountId, delta);
      }
    }

    return updated;
  });

  revalidatePath("/dashboard");
  revalidatePath(`/financialAccount/${updatedTx.financialAccountId}`);

  return {
    success: true,
    data: serializeDecimals(updatedTx) as unknown as Transaction,
  };
}

/* ----------------------------- RECEIPT SCAN ------------------------- */

const ScannedReceiptSchema = z.object({
  amount: z.number().finite().nonnegative(),
  date: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  description: z.string().default(""),
  merchantName: z.string().default(""),
  category: z
    .enum([
      "housing",
      "transportation",
      "groceries",
      "utilities",
      "entertainment",
      "food",
      "shopping",
      "healthcare",
      "education",
      "personal",
      "travel",
      "insurance",
      "gifts",
      "bills",
      "other-expense",
    ])
    .default("other-expense"),
});

export type ScannedReceipt = z.infer<typeof ScannedReceiptSchema>;

/**
 * Run a single model scan. Returns parsed JSON or {} on parse failure.
 * This isolates the parsing logic and prevents crashes when Gemini wraps results
 * in markdown or returns partial text.
 */
async function runGeminiScan(
  modelId: string,
  base64: string,
  mime: string,
  prompt: string,
  ai: GoogleGenerativeAI,
) {
  const model = ai.getGenerativeModel({
    model: modelId,
    generationConfig: { temperature: 0, maxOutputTokens: 512 },
  });

  const res = await model.generateContent([
    { inlineData: { data: base64, mimeType: mime } },
    prompt,
  ]);

  // response.text() may include ```json blocks or extra text. Clean and try parse.
  const raw = res.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    // parse guarded
    return JSON.parse(cleaned || "{}");
  } catch {
    // graceful fallback to empty object (caller will decide)
    return {};
  }
}

export async function scanReceipt(formData: FormData): Promise<ScannedReceipt> {
  const file = formData.get("file") as File | null;
  assert(file, "No file provided");

  assert(ALLOWED_MIME.has(file.type), "Unsupported file type");
  assert(file.size <= MAX_FILE_BYTES, "File too large");

  // Convert to base64
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const prompt = `
Analyze this receipt image and extract the following information in JSON format:

- Total amount (just the number)
- Date (in ISO format)
- Description or items purchased (brief summary)
- Merchant/store name
- Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )

Only respond with valid JSON in this exact format:
{
  "amount": number,
  "date": "ISO date string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}

If it's not a receipt, return an empty object.
`.trim();

  try {
    let parsed = await runGeminiScan(
      PRIMARY_MODEL,
      base64,
      file.type,
      prompt,
      AI,
    );

    const isEmpty =
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      Object.keys(parsed as Record<string, unknown>).length === 0;

    if (
      isEmpty ||
      (typeof parsed === "object" &&
        parsed !== null &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (parsed.amount == null || !parsed.date))
    ) {
      // fallback on second model for tougher receipts
      parsed = await runGeminiScan(
        FALLBACK_MODEL,
        base64,
        file.type,
        prompt,
        AI,
      );
    }

    // enforce schema + coercions
    return ScannedReceiptSchema.parse(parsed);
  } catch (error) {
    // keep a single, explicit error message for callers to handle.
    console.error("Failed to scan receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}
