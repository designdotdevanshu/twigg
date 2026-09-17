/**
 * NPCI Compliant UPI Deep Link URI Builder
 */
export interface UpiParams {
  pa: string; // Payee VPA e.g. devanshu@okhdfcbank
  pn: string; // Payee Name
  am?: number | null; // Optional amount
  tn?: string | null; // Optional transaction note
  cu?: string; // Currency, defaults to INR
}

export function buildUpiUri({ pa, pn, am, tn, cu = "INR" }: UpiParams): string {
  const cleanPa = pa.trim();
  const cleanPn = pn.trim();

  const params = new URLSearchParams();
  params.set("pa", cleanPa);
  params.set("pn", cleanPn);
  params.set("cu", cu);

  if (am !== undefined && am !== null && Number(am) > 0) {
    params.set("am", Number(am).toFixed(2));
  }

  if (tn) {
    params.set("tn", tn.trim().slice(0, 50));
  }

  return `upi://pay?${params.toString()}`;
}

export function isValidVpa(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const trimmed = vpa.trim();
  // VPA typically format: name@bank
  const regex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
  return regex.test(trimmed);
}
