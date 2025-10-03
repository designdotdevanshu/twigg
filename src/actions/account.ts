import type { FinancialAccountType } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface FinancialAccount {
  name: string;
  id: string;
  type: FinancialAccountType;
  balance: Decimal;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
