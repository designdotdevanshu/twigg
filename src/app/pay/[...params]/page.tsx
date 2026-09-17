export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPublicPaymentLink } from "@/actions/upi";
import { PublicPaymentView } from "@/components/upi/public-payment-view";

interface PayPageProps {
  params: Promise<{
    params: string[];
  }>;
  searchParams?: Promise<{
    pn?: string;
    tn?: string;
  }>;
}

export default async function PublicPayPage({
  params,
  searchParams,
}: PayPageProps) {
  const resolvedParams = (await params).params ?? [];
  const query = (await searchParams) ?? {};

  if (resolvedParams.length === 0) {
    notFound();
  }

  const firstParam = decodeURIComponent(resolvedParams[0]!);

  // Case 1: Slug-based link (e.g. /pay/a7f8b9c2)
  if (!firstParam.includes("@")) {
    const link = await getPublicPaymentLink(firstParam);
    if (!link) {
      notFound();
    }

    return (
      <PublicPaymentView
        vpa={link.vpa}
        payeeName={link.payeeName}
        amount={link.amount}
        note={link.note}
        isSlug={true}
      />
    );
  }

  // Case 2: Direct VPA link (e.g. /pay/name@bank or /pay/name@bank/250)
  const vpa = firstParam;
  const rawAmount = resolvedParams[1]
    ? parseFloat(resolvedParams[1])
    : undefined;
  const amount =
    rawAmount && !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : null;
  const payeeName = query.pn ?? "Merchant / User";
  const note = query.tn ?? null;

  return (
    <PublicPaymentView
      vpa={vpa}
      payeeName={payeeName}
      amount={amount}
      note={note}
      isSlug={false}
    />
  );
}
