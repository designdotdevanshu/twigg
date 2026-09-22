"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  Copy,
  CheckCircle2,
  Share2,
  Smartphone,
  ShieldCheck,
  Download,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { toast } from "sonner";
import { buildUpiUri } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";

interface PaymentCardViewProps {
  vpa: string;
  payeeName: string;
  amount?: number | null;
  note?: string | null;
  isSlug?: boolean;
  variant?: "standalone" | "preview" | "dialog";
  shareUrl?: string;
}

export function PaymentCardView({
  vpa,
  payeeName,
  amount,
  note,
  variant = "standalone",
  shareUrl,
}: PaymentCardViewProps) {
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const numericAmount =
    amount !== undefined && amount !== null && !isNaN(Number(amount)) && Number(amount) > 0
      ? Number(amount)
      : null;

  const upiUri = buildUpiUri({
    pa: vpa,
    pn: payeeName,
    am: numericAmount ?? undefined,
    tn: note ?? undefined,
  });

  const getEffectiveShareUrl = () => {
    if (shareUrl) return shareUrl;
    if (typeof window !== "undefined") return window.location.href;
    const query = new URLSearchParams();
    if (payeeName && payeeName !== "Merchant / User" && payeeName !== "Your Name") {
      query.set("pn", payeeName);
    }
    if (note) {
      query.set("tn", note);
    }
    const qStr = query.toString();
    const basePath = `/pay/${encodeURIComponent(vpa)}${numericAmount ? `/${numericAmount}` : ""}`;
    return qStr ? `${basePath}?${qStr}` : basePath;
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopiedVpa(true);
      toast.success("UPI ID copied to clipboard");
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch {
      toast.error("Failed to copy UPI ID");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getEffectiveShareUrl());
      setCopiedLink(true);
      toast.success("Payment page link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy payment link");
    }
  };

  const handleShare = async () => {
    const url = getEffectiveShareUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${payeeName} via UPI`,
          text: `Pay ${numericAmount ? `₹${numericAmount.toFixed(2)}` : ""} to ${payeeName} using any UPI app:`,
          url,
        });
      } catch {
        // User closed share sheet
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleDownloadQr = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains("no-export")) {
            return false;
          }
          return true;
        },
      });
      const downloadLink = document.createElement("a");
      downloadLink.download = `twigg-qr-standee-${vpa.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
      toast.success("QR Standee downloaded!");
    } catch (err) {
      console.error("Standee export failed, falling back to SVG:", err);
      const svgElement = qrRef.current.querySelector("svg");
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      const scale = 3;
      const size = 220 * scale;
      canvas.width = size;
      canvas.height = size;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `twigg-qr-${vpa.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success("QR code downloaded!");
        }
      };

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingCard(true);
      toast.info("Generating payment card image...");

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: "#0d121c",
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains("no-export")) {
            return false;
          }
          return true;
        },
      });

      const downloadLink = document.createElement("a");
      downloadLink.download = `twigg-payment-${vpa.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
      toast.success("Payment card image downloaded!");
    } catch (err) {
      console.error("Card image export failed:", err);
      toast.error("Failed to generate payment card image");
    } finally {
      setIsExportingCard(false);
    }
  };

  const isStandalone = variant === "standalone";
  const isDialog = variant === "dialog";

  return (
    <div
      className={
        isStandalone
          ? "flex min-h-screen flex-col justify-between bg-[#070a0f] p-4 text-slate-100 selection:bg-emerald-500 selection:text-black sm:p-6"
          : "w-full text-slate-100"
      }
    >
      {/* Top Header only for standalone view */}
      {isStandalone && (
        <header className="mx-auto flex w-full max-w-md items-center justify-between py-2">
          <BrandLogo size="md" href="/" />

          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-400"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Merchant</span>
          </Badge>
        </header>
      )}

      {/* Main Payment Card Container */}
      <main className={isStandalone ? "mx-auto my-auto w-full max-w-md py-4" : "w-full"}>
        <div ref={cardRef}>
          <Card
            className={`overflow-hidden border-slate-800/90 bg-[#0d121c] shadow-2xl backdrop-blur-xl ${
              isDialog ? "border-0 shadow-none bg-transparent" : "rounded-3xl"
            }`}
          >
            {/* Card Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            <CardContent className="flex flex-col items-center space-y-5 p-6 text-center sm:p-7">
              {/* Payee Details */}
              <div className="space-y-1.5 w-full">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Payment Request
                </span>

                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl truncate px-2">
                  {payeeName || "Merchant / User"}
                </h2>

                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={handleCopyVpa}
                    className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400 transition hover:bg-emerald-500/15 hover:text-emerald-300"
                    title="Click to copy UPI ID"
                  >
                    <span className="truncate max-w-[240px]">{vpa}</span>
                    {copiedVpa ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {/* Amount Section */}
              {numericAmount ? (
                <div className="w-full rounded-2xl border border-emerald-500/15 bg-emerald-500/5 py-3 px-4">
                  <span className="mb-0.5 block text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                    Amount to Pay
                  </span>
                  <div className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {formatCurrency(numericAmount, "INR")}
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-2.5 px-3">
                  <span className="block text-xs font-semibold text-slate-300">
                    Open Amount Payment
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    Scan to enter custom amount in your UPI app
                  </span>
                </div>
              )}

              {/* Optional Note */}
              {note && (
                <div className="max-w-xs rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 italic">
                  &ldquo;{note}&rdquo;
                </div>
              )}

              {/* Dedicated Branded QR Merchant Standee Plaque */}
              <div className="w-full flex flex-col items-center">
                <div
                  ref={qrRef}
                  onClick={handleDownloadQr}
                  title="Click to download QR standee image"
                  className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-2xl transition-all duration-200 ring-4 ring-emerald-500/10 group-hover:ring-emerald-500/30 group-hover:scale-[1.02] flex flex-col items-center w-[260px] sm:w-[270px] select-none text-slate-900 border border-slate-100"
                >
                  {/* Standee Plaque Header */}
                  <div className="w-full flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-[10px] font-black text-slate-950 shadow-xs">
                        T
                      </div>
                      <span className="text-xs font-bold tracking-tight text-slate-900">
                        twigg
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Accepted Here
                      </span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative flex items-center justify-center p-1 bg-white">
                    <QRCodeSVG
                      value={upiUri}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />

                    {/* Hover download overlay */}
                    <div className="no-export absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-950/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Download className="h-6 w-6 text-emerald-400 mb-1 animate-bounce" />
                      <span className="text-[10px] font-bold text-white bg-slate-900/95 px-2.5 py-1 rounded-full border border-white/20 shadow-md">
                        Click to Save QR
                      </span>
                    </div>
                  </div>

                  {/* Standee Plaque Footer */}
                  <div className="w-full pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500">
                      Scan with any UPI app
                    </span>
                    <span className="text-[9px] font-extrabold tracking-wider text-slate-700 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded">
                      BHIM UPI
                    </span>
                  </div>
                </div>
              </div>

              <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
                Scan with any UPI app on your mobile phone:
                <span className="mt-1 block font-medium text-slate-300">
                  Google Pay &bull; PhonePe &bull; Paytm &bull; BHIM &bull; CRED
                </span>
              </p>

              {/* Action Suite (Filtered out during image export) */}
              <div className="no-export w-full space-y-2 pt-1">
                {/* Primary Mobile Button: Direct UPI App Deep Link */}
                <a href={upiUri} className="block w-full">
                  <Button
                    size="lg"
                    className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98]"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Pay via UPI App</span>
                  </Button>
                </a>

                {/* Secondary Buttons: Copy, Share, Download Card, and Download QR */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyVpa}
                    className="h-9 gap-1.5 border-slate-800 bg-slate-900/90 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedVpa ? "Copied" : "Copy UPI ID"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="h-9 gap-1.5 border-slate-800 bg-slate-900/90 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                    title="Share payment link"
                  >
                    {copiedLink ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedLink ? "Copied Link" : "Share Link"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCard}
                    disabled={isExportingCard}
                    className="h-9 gap-1.5 border-slate-800 bg-slate-900/90 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                    title="Download complete payment card image"
                  >
                    {isExportingCard ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>Save Card</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQr}
                    className="h-9 gap-1.5 border-slate-800 bg-slate-900/90 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
                    title="Download QR Code image"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Save QR Code</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NPCI Trust Badges Footer */}
        <div className="mt-5 flex flex-col items-center justify-center space-y-1.5 text-center">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Unified Payments Interface</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-medium">NPCI Regulated</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Zero fees &bull; Instant peer-to-peer bank settlement
          </p>
        </div>
      </main>

      {/* Footer / CTA for Twigg */}
      {isStandalone && (
        <footer className="mx-auto w-full max-w-md py-3 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-emerald-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Manage your finances & accept UPI payments with Twigg</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </footer>
      )}
    </div>
  );
}
