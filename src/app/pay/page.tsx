"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PaymentCardView } from "@/components/upi/payment-card-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  ExternalLink,
  Share2,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Zap,
  Link2,
  MessageCircle,
} from "lucide-react";

export default function PublicPayGeneratorPage() {
  const [vpa, setVpa] = useState("yourname@upi");
  const [payeeName, setPayeeName] = useState("Your Name");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  // Validate UPI ID format
  const isValidVpa = useMemo(() => {
    return vpa.trim().length > 3 && vpa.includes("@");
  }, [vpa]);

  // Construct resulting public URL
  const numericAmount = parseFloat(amount);
  const hasValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  const generatedPath = useMemo(() => {
    if (!vpa.trim() || !isValidVpa) return "";
    const cleanVpa = vpa.trim().replace(/\s+/g, "");
    const basePath = hasValidAmount ? `/pay/${cleanVpa}/${numericAmount}` : `/pay/${cleanVpa}`;
    const params = new URLSearchParams();
    if (payeeName.trim() && payeeName.trim() !== "Your Name") {
      params.set("pn", payeeName.trim());
    }
    if (note.trim()) {
      params.set("tn", note.trim());
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }, [vpa, isValidVpa, hasValidAmount, numericAmount, payeeName, note]);

  const fullGeneratedUrl = useMemo(() => {
    if (!generatedPath) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}${generatedPath}`;
    }
    return `https://twigg.app${generatedPath}`;
  }, [generatedPath]);

  const handleCopyLink = async () => {
    if (!fullGeneratedUrl) {
      toast.error("Please enter a valid UPI ID first (e.g. name@bank)");
      return;
    }
    try {
      await navigator.clipboard.writeText(fullGeneratedUrl);
      setCopied(true);
      toast.success("Payment page link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!fullGeneratedUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${payeeName} via UPI`,
          text: `Pay ${hasValidAmount ? `₹${numericAmount.toFixed(2)}` : ""} to ${payeeName}:`,
          url: fullGeneratedUrl,
        });
      } catch {
        // User closed share dialog
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    if (!fullGeneratedUrl) return;
    const text = `Pay ${hasValidAmount ? `₹${numericAmount.toFixed(2)}` : ""} to ${payeeName.trim() || "me"} via UPI:\n${fullGeneratedUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0a0e17]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo size="md" href="/" badge="Instant Pay" />

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400 text-xs h-8"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Title */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>Zero Login &bull; 100% Free &bull; Instant UPI Deep Links</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Create Shareable UPI Payment Links
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Generate a high-converting, branded payment page and QR code for your UPI ID. Anyone can pay you using Google Pay, PhonePe, Paytm, or BHIM.
          </p>
        </div>

        {/* Two-Column Generator & Live Preview */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Form: Link Configuration */}
          <div className="space-y-6 lg:col-span-6">
            <Card className="border-slate-800 bg-[#0d121c]/90 shadow-xl backdrop-blur-xl rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-400" />
                  <span>Configure Payment Link</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Enter your payment details below. Your shareable link and live preview update instantly.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                {/* UPI VPA Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-200">
                      Receiving UPI ID <span className="text-emerald-400">*</span>
                    </Label>
                    {!isValidVpa && vpa.length > 0 && (
                      <span className="text-[11px] text-amber-400">Include @ (e.g. name@bank)</span>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. name@okhdfcbank or business@upi"
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value.trim())}
                    className="h-10 border-slate-700 bg-slate-900/90 font-mono text-xs text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Payee Display Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-200">
                    Payee Display Name <span className="text-emerald-400">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Devanshu Sagar or Acme Studio"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    className="h-10 border-slate-700 bg-slate-900/90 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Amount and Remark in 2 cols */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-200">
                      Fixed Amount (₹ Optional)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave blank for any amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-10 border-slate-700 bg-slate-900/90 font-mono text-xs text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-200">
                      Transaction Note (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. Design split, Rent"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={40}
                      className="h-10 border-slate-700 bg-slate-900/90 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Share & Export Hub Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5 pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Shareable Payment Link</span>
                    </Label>
                    {isValidVpa && (
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Ready to Share
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        value={isValidVpa ? fullGeneratedUrl : "Enter a valid UPI ID above..."}
                        className="h-10 border-slate-700 bg-slate-950 font-mono text-xs text-emerald-400 pr-9 selection:bg-emerald-500 selection:text-black"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleCopyLink}
                      disabled={!isValidVpa}
                      className="h-10 bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400 text-xs px-3.5 gap-1.5 shrink-0"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Quick Sharing & Preview Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWhatsAppShare}
                      disabled={!isValidVpa}
                      className="h-9 text-xs border-emerald-900/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40 hover:text-emerald-200 gap-1.5"
                      title="Share payment link on WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShare}
                      disabled={!isValidVpa}
                      className="h-9 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 gap-1.5"
                      title="Share payment link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </Button>

                    {isValidVpa && generatedPath ? (
                      <Link href={generatedPath} target="_blank" className="w-full">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full h-9 text-xs font-medium gap-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          title="Open live payment page in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Live Page</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled
                        className="w-full h-9 text-xs font-medium gap-1.5 bg-slate-800/50 text-slate-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Live Page</span>
                      </Button>
                    )}
                  </div>

                  {/* Encoded Details Summary Badges */}
                  {isValidVpa && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span className="text-slate-500 font-medium">Encoded:</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">
                        {vpa}
                      </span>
                      {payeeName && payeeName !== "Your Name" && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {payeeName}
                        </span>
                      )}
                      {hasValidAmount && (
                        <span className="rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 font-mono font-medium">
                          ₹{numericAmount.toFixed(2)}
                        </span>
                      )}
                      {note.trim() && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 italic">
                          &ldquo;{note.trim()}&rdquo;
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick URL Syntax Helper */}
            <div className="rounded-xl border border-slate-800/80 bg-[#0d121c]/50 p-4 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-slate-300 block">
                💡 Direct Browser URL Syntax:
              </span>
              <p className="font-mono text-[11px] text-emerald-400">
                twigg.app/pay/&lt;upi-id&gt;
              </p>
              <p className="font-mono text-[11px] text-emerald-400">
                twigg.app/pay/&lt;upi-id&gt;/&lt;amount&gt;
              </p>
              <p className="font-mono text-[11px] text-slate-300">
                twigg.app/pay/&lt;upi-id&gt;/&lt;amount&gt;?pn=&lt;name&gt;&amp;tn=&lt;note&gt;
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Parameters are parsed automatically to set up the payment standee, generate real-time QR codes, and trigger direct UPI deep links.
              </p>
            </div>
          </div>

          {/* Right Column: Live Payment Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Live Payer View
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400 gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Real-time
                </Badge>
              </div>

              {/* Render PaymentCardView in Preview Mode */}
              <PaymentCardView
                vpa={vpa || "yourname@upi"}
                payeeName={payeeName || "Your Name"}
                amount={hasValidAmount ? numericAmount : null}
                note={note.trim() ? note.trim() : null}
                variant="preview"
                shareUrl={fullGeneratedUrl}
              />
            </div>
          </div>
        </div>

        {/* Feature / Upgrade Callout Banner */}
        <div className="mt-16 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5 max-w-xl">
              <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px] mb-1">
                FOR FREELANCERS & BUSINESSES
              </Badge>
              <h3 className="text-lg font-bold text-white sm:text-xl">
                Want automatic income recording, custom short links & multi-VPA management?
              </h3>
              <p className="text-xs text-slate-400 sm:text-sm">
                Twigg Workspace tracks payment settlements, organizes business sub-funds, and provides branded commercial payment pages.
              </p>
            </div>

            <Link href="/signup" className="shrink-0">
              <Button className="h-11 rounded-xl bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400 gap-2 px-5 text-sm shadow-lg shadow-emerald-500/20">
                <span>Open Free Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Twigg. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/pay" className="hover:text-emerald-400 transition">UPI Generator</Link>
            <span>&bull;</span>
            <Link href="/signin" className="hover:text-emerald-400 transition">Sign In</Link>
            <span>&bull;</span>
            <Link href="/signup" className="hover:text-emerald-400 transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
