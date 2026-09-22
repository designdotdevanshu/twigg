"use client";

import React from "react";
import { PaymentCardView } from "./payment-card-view";

interface PublicPaymentViewProps {
  vpa: string;
  payeeName: string;
  amount?: number | null;
  note?: string | null;
  isSlug?: boolean;
}

export function PublicPaymentView({
  vpa,
  payeeName,
  amount,
  note,
  isSlug,
}: PublicPaymentViewProps) {
  return (
    <PaymentCardView
      vpa={vpa}
      payeeName={payeeName}
      amount={amount}
      note={note}
      isSlug={isSlug}
      variant="standalone"
    />
  );
}
