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
  workspaceId: string;
  financialAccountId: string;
  pocketId: string | null;
  pocket?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  financialAccount?: {
    id: string;
    name: string;
  } | null;
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
  pocketId: z.string().nullable().optional(),
  amount: z.number().finite(),
  description: z.string().nullable().optional(),
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
  category: z.string().min(1),
  receiptUrl: z.string().url().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).nullable().optional(),
  status: z.nativeEnum(TransactionStatus).default("COMPLETED"),
});

const updateTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  financialAccountId: z.string().min(1),
  pocketId: z.string().nullable().optional(),
  amount: z.number().finite(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).nullable().optional(),
  date: z.union([z.date(), z.string().transform((s) => new Date(s))]),
  description: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
  receiptUrl: z.string().url().nullable().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.input<typeof updateTransactionSchema>;

import { serializeDecimal } from "@/lib/utils";

/* ----------------------------- UTIL HELPERS ------------------------- */

function toDecimal(v: DecimalLike): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

function signAmount(type: TransactionType, amount: number): Prisma.Decimal {
  const dec = toDecimal(amount);
  return type === "EXPENSE" ? dec.mul(-1) : dec;
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

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
      d.setMonth(d.getMonth() + 1);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

/* ----------------------------- DB HELPERS --------------------------- */

async function ensureAccountOwnedByUser(
  accountId: string,
  userId: string,
  tx: Prisma.TransactionClient = db,
) {
  const fa = await tx.financialAccount.findFirst({
    where: { id: accountId, workspace: { userId } },
    select: { id: true, workspaceId: true },
  });
  assert(fa, "Financial account not found or unauthorized");
  return fa;
}

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

async function adjustPocketBalance(
  tx: Prisma.TransactionClient,
  pocketId: string,
  delta: Prisma.Decimal,
) {
  await tx.pocket.update({
    where: { id: pocketId },
    data: { currentBalance: { increment: delta } },
  });
}

/* ----------------------------- ACTIONS ------------------------------ */

/** Create Transaction (atomic balance updates for both account and optional pocket). */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<TransactionResponse> {
  const parsed = createTransactionSchema.parse(input);
  const { id: userId } = await getUserSession();

  // Ensure account belongs to user and retrieve workspaceId
  const account = await ensureAccountOwnedByUser(
    parsed.financialAccountId,
    userId,
  );

  // If pocketId provided, ensure it belongs to this account
  if (parsed.pocketId) {
    const pocket = await db.pocket.findFirst({
      where: {
        id: parsed.pocketId,
        financialAccountId: parsed.financialAccountId,
      },
    });
    assert(pocket, "Pocket does not belong to selected account");
  }

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
        workspaceId: account.workspaceId,
        type: parsed.type,
        financialAccountId: parsed.financialAccountId,
        pocketId: parsed.pocketId ?? null,
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
      include: {
        pocket: {
          select: { id: true, name: true, color: true },
        },
        financialAccount: {
          select: { id: true, name: true },
        },
      },
    });

    // Update account balance
    await adjustAccountBalance(tx, parsed.financialAccountId, balanceChange);

    // Update pocket balance if assigned
    if (parsed.pocketId) {
      await adjustPocketBalance(tx, parsed.pocketId, balanceChange);
    }

    return newTransaction;
  });

  revalidatePath("/[workspaceId]/dashboard", "page");
  revalidatePath("/[workspaceId]/account/[id]", "page");

  return {
    success: true,
    data: serializeDecimal(created) as unknown as Transaction,
  };
}

/** Get single transaction, scoped to user workspace. */
export async function getTransaction(id: string): Promise<Transaction | null> {
  const { id: userId } = await getUserSession();

  const tx = await db.transaction.findFirst({
    where: { id, workspace: { userId } },
    include: {
      pocket: {
        select: { id: true, name: true, color: true },
      },
      financialAccount: {
        select: { id: true, name: true },
      },
    },
  });
  assert(tx, "Transaction not found");

  return serializeDecimal(tx) as unknown as Transaction;
}

/** Update transaction with atomic balance adjustments for account and pocket. */
export async function updateTransaction(
  id: string,
  payload: UpdateTransactionInput,
): Promise<TransactionResponse> {
  const data = updateTransactionSchema.parse(payload);
  const { id: userId } = await getUserSession();

  const updatedTx = await db.$transaction(async (tx) => {
    const original = await tx.transaction.findFirst({
      where: { id, workspace: { userId } },
    });
    assert(original, "Transaction not found");

    const targetAccount = await ensureAccountOwnedByUser(
      data.financialAccountId,
      userId,
      tx,
    );

    if (data.pocketId) {
      const p = await tx.pocket.findFirst({
        where: {
          id: data.pocketId,
          financialAccountId: data.financialAccountId,
        },
      });
      assert(p, "Target pocket does not belong to selected account");
    }

    const oldChange = signAmount(original.type, original.amount.toNumber());
    const newChange = signAmount(data.type, data.amount);

    const nextRecurring =
      data.isRecurring && data.recurringInterval
        ? calculateNextRecurringDate(
            new Date(data.date),
            data.recurringInterval,
          )
        : null;

    const updated = await tx.transaction.update({
      where: { id },
      data: {
        type: data.type,
        workspaceId: targetAccount.workspaceId,
        financialAccountId: data.financialAccountId,
        pocketId: data.pocketId ?? null,
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
      include: {
        pocket: { select: { id: true, name: true, color: true } },
        financialAccount: { select: { id: true, name: true } },
      },
    });

    // Handle account balance adjustments
    if (original.financialAccountId !== data.financialAccountId) {
      await adjustAccountBalance(
        tx,
        original.financialAccountId,
        oldChange.mul(-1),
      );
      await adjustAccountBalance(tx, data.financialAccountId, newChange);
    } else {
      const delta = newChange.sub(oldChange);
      if (!delta.eq(0)) {
        await adjustAccountBalance(tx, data.financialAccountId, delta);
      }
    }

    // Handle pocket balance adjustments
    if (original.pocketId !== data.pocketId) {
      if (original.pocketId) {
        await adjustPocketBalance(tx, original.pocketId, oldChange.mul(-1));
      }
      if (data.pocketId) {
        await adjustPocketBalance(tx, data.pocketId, newChange);
      }
    } else if (data.pocketId) {
      const delta = newChange.sub(oldChange);
      if (!delta.eq(0)) {
        await adjustPocketBalance(tx, data.pocketId, delta);
      }
    }

    return updated;
  });

  revalidatePath("/[workspaceId]/dashboard", "page");
  revalidatePath("/[workspaceId]/account/[id]", "page");

  return {
    success: true,
    data: serializeDecimal(updatedTx) as unknown as Transaction,
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

  const raw = res.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned || "{}");
  } catch {
    return {};
  }
}

export async function scanReceipt(formData: FormData): Promise<ScannedReceipt> {
  const file = formData.get("file") as File | null;
  assert(file, "No file provided");
  assert(ALLOWED_MIME.has(file.type), "Unsupported file type");
  assert(file.size <= MAX_FILE_BYTES, "File too large");

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
        ((parsed as Record<string, unknown>).amount == null ||
          !(parsed as Record<string, unknown>).date))
    ) {
      parsed = await runGeminiScan(
        FALLBACK_MODEL,
        base64,
        file.type,
        prompt,
        AI,
      );
    }

    return ScannedReceiptSchema.parse(parsed);
  } catch (error) {
    console.error("Failed to scan receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}
