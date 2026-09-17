"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { buildUpiUri } from "@/lib/upi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Share2,
} from "lucide-react";

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
}: PublicPaymentViewProps) {
  const [customAmount, setCustomAmount] = useState(
    amount && amount > 0 ? String(amount) : "",
  );
  const [copied, setCopied] = useState(false);

  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;

  const upiUri = buildUpiUri({
    pa: vpa,
    pn: payeeName,
    am: effectiveAmount && effectiveAmount > 0 ? effectiveAmount : undefined,
    tn: note ?? undefined,
  });

  const handleCopyVpa = () => {
    void navigator.clipboard.writeText(vpa);
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${payeeName} via UPI`,
          text: `Pay ${effectiveAmount ? `₹${effectiveAmount}` : ""} to ${payeeName} using any UPI app:`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      void navigator.clipboard.writeText(window.location.href);
      toast.success("Payment page link copied!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#070a0f] p-4 text-slate-100 selection:bg-emerald-500 selection:text-black sm:p-6">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-2">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-sm font-black text-slate-950 shadow-md shadow-emerald-500/20 transition group-hover:scale-105">
            T
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            twigg
          </span>
        </Link>

        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-400"
        >
          <ShieldCheck className="h-3 w-3" /> Verified Merchant / User
        </Badge>
      </header>

      {/* Main Payment Card */}
      <main className="mx-auto my-auto w-full max-w-md py-6">
        <Card className="overflow-hidden rounded-3xl border-slate-800 bg-[#0d121c]/90 shadow-2xl backdrop-blur-xl">
          {/* Card Top Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <CardContent className="flex flex-col items-center space-y-6 p-6 text-center sm:p-8">
            {/* Payee Info */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Payment Request
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {payeeName}
              </h2>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400 transition hover:bg-emerald-500/15 hover:text-emerald-300"
              >
                <span>{vpa}</span>
                {copied ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-emerald-400" />
                )}
              </button>
            </div>

            {/* Amount Section */}
            {amount && amount > 0 ? (
              <div className="py-2">
                <span className="mb-0.5 block text-xs font-medium text-slate-400">
                  Amount to Pay
                </span>
                <div className="font-mono text-4xl font-black tracking-tight text-white">
                  ₹{Number(amount).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs space-y-1.5 py-1">
                <span className="block text-xs font-medium text-slate-400">
                  Enter Custom Amount (₹)
                </span>
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 pr-3 pl-8 text-center font-mono text-lg font-bold text-white transition focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {note && (
              <div className="max-w-xs rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300 italic">
                &ldquo;{note}&rdquo;
              </div>
            )}

            {/* QR Code Container */}
            <div className="rounded-2xl bg-white p-4 shadow-xl transition hover:scale-[1.02]">
              <QRCodeSVG
                value={upiUri}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
              Scan this QR code using any UPI app on your mobile phone:
              <span className="mt-1 block font-medium text-slate-300">
                Google Pay &bull; PhonePe &bull; Paytm &bull; BHIM &bull; CRED
              </span>
            </p>

            {/* Action Buttons: Mobile Pay Now & Desktop Copy */}
            <div className="w-full space-y-2.5 pt-2">
              {/* Primary Mobile Button: Launches UPI App Chooser via deep link */}
              <a href={upiUri} className="block w-full">
                <Button
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98]"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Pay via UPI App</span>
                </Button>
              </a>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyVpa}
                  className="h-9 flex-1 gap-1.5 border-slate-800 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? "Copied!" : "Copy UPI ID"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-9 border-slate-800 bg-slate-900 px-3 text-xs text-slate-200 hover:bg-slate-800"
                  title="Share payment page"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NPCI Trust Badges Footer */}
        <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Unified Payments Interface
            </span>
            <span>&bull;</span>
            <span>NPCI Regulated</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Zero transaction fees &bull; Instant peer-to-peer bank settlement
          </p>
        </div>
      </main>

      {/* Footer / CTA for Twigg */}
      <footer className="mx-auto w-full max-w-md py-4 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-emerald-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Manage your finances & accept UPI payments with Twigg</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </footer>
    </div>
  );
}
