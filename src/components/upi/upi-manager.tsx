"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import {
  createUserUpiId,
  deleteUserUpiId,
  createPaymentLink,
  markPaymentReceived,
  type UpiIdItem,
  type PaymentLinkItem,
} from "@/actions/upi";
import type { FinancialAccount } from "@/actions/account";
import { buildUpiUri } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Share2,
  IndianRupee,
  Eye,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface UpiManagerProps {
  workspaceId: string;
  initialUpiIds: UpiIdItem[];
  initialLinks: PaymentLinkItem[];
  accounts: FinancialAccount[];
  userName?: string;
  currency?: string;
}

export function UpiManager({
  workspaceId,
  initialUpiIds,
  initialLinks,
  accounts,
  userName = "Twigg User",
  currency = "INR",
}: UpiManagerProps) {
  const [upiIds, setUpiIds] = useState<UpiIdItem[]>(initialUpiIds);
  const [links, setLinks] = useState<PaymentLinkItem[]>(initialLinks);

  // Add VPA State
  const [isAddVpaOpen, setIsAddVpaOpen] = useState(false);
  const [vpaLabel, setVpaLabel] = useState("");
  const [vpaAddress, setVpaAddress] = useState("");
  const [savingVpa, setSavingVpa] = useState(false);

  // Generate Link State
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [linkVpa, setLinkVpa] = useState(initialUpiIds[0]?.vpa ?? "");
  const [linkPayee, setLinkPayee] = useState(userName);
  const [linkAmount, setLinkAmount] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Preview QR Modal State
  const [previewLink, setPreviewLink] = useState<PaymentLinkItem | null>(null);

  // Mark Received Modal State
  const [receivedLink, setReceivedLink] = useState<PaymentLinkItem | null>(
    null,
  );
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? "",
  );
  const [customAmount, setCustomAmount] = useState("");
  const [markingReceived, setMarkingReceived] = useState(false);

  // Save new UPI ID
  const handleSaveVpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpaLabel.trim()) {
      toast.error("Label is required (e.g. HDFC Primary)");
      return;
    }
    if (!vpaAddress.trim() || !vpaAddress.includes("@")) {
      toast.error("Please enter a valid UPI address (e.g. user@bank)");
      return;
    }

    setSavingVpa(true);
    try {
      const res = await createUserUpiId({
        label: vpaLabel.trim(),
        vpa: vpaAddress.trim(),
        isPrimary: upiIds.length === 0,
      });

      if (res.success && res.data) {
        setUpiIds((prev) => [res.data!, ...prev]);
        if (!linkVpa) setLinkVpa(res.data.vpa);
        setIsAddVpaOpen(false);
        setVpaLabel("");
        setVpaAddress("");
        toast.success("UPI ID saved successfully");
      } else {
        toast.error(res.error ?? "Failed to save UPI ID");
      }
    } catch {
      toast.error("Error saving UPI ID");
    } finally {
      setSavingVpa(false);
    }
  };

  // Delete UPI ID
  const handleDeleteVpa = async (id: string) => {
    try {
      const res = await deleteUserUpiId(id);
      if (res.success) {
        setUpiIds((prev) => prev.filter((item) => item.id !== id));
        toast.success("UPI ID removed");
      } else {
        toast.error(res.error ?? "Failed to remove UPI ID");
      }
    } catch {
      toast.error("Error deleting UPI ID");
    }
  };

  // Create shareable payment link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkVpa) {
      toast.error("Please select or enter a UPI ID");
      return;
    }
    if (!linkPayee.trim()) {
      toast.error("Payee name is required");
      return;
    }

    const amt = linkAmount ? parseFloat(linkAmount) : undefined;
    if (linkAmount && (isNaN(amt!) || amt! <= 0)) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    setSavingLink(true);
    try {
      const res = await createPaymentLink({
        vpa: linkVpa,
        payeeName: linkPayee.trim(),
        amount: amt,
        note: linkNote.trim() || undefined,
        workspaceId,
      });

      if (res.success && res.data) {
        setLinks((prev) => [res.data!, ...prev]);
        setIsCreateLinkOpen(false);
        setLinkAmount("");
        setLinkNote("");
        setPreviewLink(res.data);
        toast.success("Payment page generated!");
      } else {
        toast.error(res.error ?? "Failed to create payment link");
      }
    } catch {
      toast.error("Error creating link");
    } finally {
      setSavingLink(false);
    }
  };

  // Copy link to clipboard
  const handleCopy = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    void navigator.clipboard.writeText(url);
    toast.success("Payment link copied to clipboard");
  };

  // Native Web Share API
  const handleShare = async (link: PaymentLinkItem) => {
    const url = `${window.location.origin}/pay/${link.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${link.payeeName} via UPI`,
          text: `Pay ${link.amount ? `₹${link.amount}` : ""} to ${link.payeeName} using any UPI app (GPay, PhonePe, Paytm):`,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy(link.slug);
    }
  };

  // Mark link as received and deposit to account
  const handleConfirmReceived = async () => {
    if (!receivedLink) return;
    if (!selectedAccountId) {
      toast.error("Please select a financial account for the deposit");
      return;
    }

    const finalAmount = customAmount
      ? parseFloat(customAmount)
      : (receivedLink.amount ?? 0);

    if (finalAmount <= 0) {
      toast.error("Please enter the amount received");
      return;
    }

    setMarkingReceived(true);
    try {
      const res = await markPaymentReceived({
        linkId: receivedLink.id,
        financialAccountId: selectedAccountId,
        workspaceId,
        amountReceived: finalAmount,
      });

      if (res.success) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === receivedLink.id ? { ...l, status: "RECEIVED" } : l,
          ),
        );
        setReceivedLink(null);
        toast.success(
          `Recorded ${formatCurrency(finalAmount, currency)} as income in account`,
        );
      } else {
        toast.error(res.error ?? "Failed to mark payment received");
      }
    } catch {
      toast.error("Error processing transaction");
    } finally {
      setMarkingReceived(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              UPI Payments & QR
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            >
              Instant Settlement
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Generate branded payment pages and QR codes to accept instant money
            transfers via Google Pay, PhonePe, Paytm, or BHIM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateLinkOpen(true)}
            className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Create Payment Page
          </Button>
        </div>
      </div>

      {/* 2. Saved UPI VPAs Section */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Saved UPI Addresses (VPAs)
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Your registered UPI addresses for receiving payments.
            </CardDescription>
          </div>

          <Dialog open={isAddVpaOpen} onOpenChange={setIsAddVpaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add UPI ID
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSaveVpa}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Smartphone className="h-4 w-4 text-emerald-500" />
                    Register UPI Address
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Enter the VPA from your Google Pay, PhonePe, or banking app.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label</Label>
                    <Input
                      placeholder="e.g. HDFC Personal, GPay Business"
                      value={vpaLabel}
                      onChange={(e) => setVpaLabel(e.target.value)}
                      className="h-9 text-xs"
                      disabled={savingVpa}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">UPI Address (VPA)</Label>
                    <Input
                      placeholder="e.g. username@okhdfcbank"
                      value={vpaAddress}
                      onChange={(e) => setVpaAddress(e.target.value)}
                      className="h-9 font-mono text-xs"
                      disabled={savingVpa}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddVpaOpen(false)}
                    disabled={savingVpa}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingVpa}
                    className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    {savingVpa ? "Saving..." : "Save UPI ID"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {upiIds.length === 0 ? (
            <div className="bg-accent/15 rounded-xl border border-dashed p-6 text-center">
              <p className="text-muted-foreground mb-3 text-xs">
                No UPI addresses saved yet. Add your VPA to generate instant
                payment QR codes.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setIsAddVpaOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Your First UPI ID
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upiIds.map((item) => (
                <div
                  key={item.id}
                  className="border-border/80 bg-accent/10 hover:bg-accent/20 flex items-center justify-between rounded-xl border p-3.5 transition"
                >
                  <div className="mr-2 space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground truncate text-xs font-semibold">
                        {item.label}
                      </span>
                      {item.isPrimary && (
                        <span className="py-0.2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 text-[9px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {item.vpa}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      onClick={() => {
                        void navigator.clipboard.writeText(item.vpa);
                        toast.success("VPA copied");
                      }}
                      title="Copy VPA"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground h-8 w-8 p-0 hover:text-rose-500"
                      onClick={() => handleDeleteVpa(item.id)}
                      title="Delete VPA"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Generated Payment Pages / Links */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <QrCode className="h-4 w-4 text-emerald-500" />
              Active Payment Links & QR Codes
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Shareable URLs with dynamic QR codes that open UPI apps directly
              on payer devices.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {links.length === 0 ? (
            <div className="bg-accent/15 rounded-xl border border-dashed p-8 text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-foreground text-xs font-semibold">
                No payment links generated yet
              </h3>
              <p className="text-muted-foreground mx-auto mt-0.5 mb-3 max-w-sm text-[11px]">
                Create a dedicated landing page with a fixed or open amount to
                share over WhatsApp, SMS, or invoices.
              </p>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                onClick={() => setIsCreateLinkOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Payment Page
              </Button>
            </div>
          ) : (
            <div className="divide-border/60 divide-y">
              {links.map((link) => {
                const isReceived = link.status === "RECEIVED";

                return (
                  <div
                    key={link.id}
                    className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">
                          {link.payeeName}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          ({link.vpa})
                        </span>
                        {isReceived ? (
                          <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Received
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-foreground font-bold">
                          {link.amount ? `₹${link.amount}` : "Open Amount"}
                        </span>
                        {link.note && (
                          <span className="bg-accent/30 rounded px-2 py-0.5 text-[11px] italic">
                            &ldquo;{link.note}&rdquo;
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px]">
                          <Eye className="h-3 w-3" /> {link.views} views
                        </span>
                        <span className="text-[11px]">
                          Created{" "}
                          {format(new Date(link.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setPreviewLink(link)}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        QR Code
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleCopy(link.slug)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleShare(link)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </Button>

                      {!isReceived && accounts.length > 0 && (
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                          onClick={() => {
                            setReceivedLink(link);
                            setCustomAmount(
                              link.amount ? String(link.amount) : "",
                            );
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Received
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Generate Link Dialog */}
      <Dialog open={isCreateLinkOpen} onOpenChange={setIsCreateLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateLink}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-emerald-500" />
                Generate UPI Payment Page
              </DialogTitle>
              <DialogDescription className="text-xs">
                Creates a shareable link with an interactive QR code and mobile
                app deep links.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Receiving UPI VPA</Label>
                {upiIds.length > 0 ? (
                  <Select value={linkVpa} onValueChange={setLinkVpa}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select UPI ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {upiIds.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.vpa}
                          className="text-xs"
                        >
                          {item.label} ({item.vpa})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. name@okhdfcbank"
                    value={linkVpa}
                    onChange={(e) => setLinkVpa(e.target.value)}
                    className="h-9 font-mono text-xs"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payee Display Name</Label>
                <Input
                  value={linkPayee}
                  onChange={(e) => setLinkPayee(e.target.value)}
                  placeholder="e.g. Devanshu Sagar"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fixed Amount (₹ Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={linkAmount}
                  onChange={(e) => setLinkAmount(e.target.value)}
                  placeholder="Leave empty for open payer amount"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Transaction Remark / Note (Optional)
                </Label>
                <Input
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  placeholder="e.g. Project retainer, Dinner split"
                  className="h-9 text-xs"
                  maxLength={50}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateLinkOpen(false)}
                disabled={savingLink}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingLink}
                className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                {savingLink ? "Creating..." : "Generate Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. QR Code Preview Dialog */}
      <Dialog
        open={!!previewLink}
        onOpenChange={(open) => !open && setPreviewLink(null)}
      >
        <DialogContent className="border-slate-800 bg-[#0b0f17] text-center text-slate-200 sm:max-w-sm">
          {previewLink && (
            <div>
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950">
                  T
                </div>
                <DialogTitle className="text-base font-bold text-white">
                  Pay {previewLink.payeeName}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-slate-400">
                  {previewLink.vpa}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center py-6">
                <div className="rounded-2xl bg-white p-4 shadow-xl">
                  <QRCodeSVG
                    value={buildUpiUri({
                      pa: previewLink.vpa,
                      pn: previewLink.payeeName,
                      am: previewLink.amount,
                      tn: previewLink.note,
                    })}
                    size={200}
                    level="H"
                  />
                </div>

                {previewLink.amount ? (
                  <div className="mt-4 text-2xl font-bold text-white">
                    ₹{previewLink.amount.toFixed(2)}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    Scan with any UPI App (GPay, PhonePe, Paytm)
                  </p>
                )}

                {previewLink.note && (
                  <p className="mt-1 text-xs font-medium text-emerald-400 italic">
                    &ldquo;{previewLink.note}&rdquo;
                  </p>
                )}
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(previewLink.slug)}
                  className="w-full border-slate-700 text-xs hover:bg-slate-800"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy Share Link
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="w-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  <a
                    href={`/pay/${previewLink.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Open Page
                  </a>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Mark Received Dialog */}
      <Dialog
        open={!!receivedLink}
        onOpenChange={(open) => !open && setReceivedLink(null)}
      >
        <DialogContent className="sm:max-w-md">
          {receivedLink && (
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Record Received Payment
                </DialogTitle>
                <DialogDescription className="text-xs">
                  This will log an income transaction in your workspace and
                  update the link status.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Deposit Account</Label>
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          {a.name} (
                          {formatCurrency(Number(a.balance), currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Amount Received (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceivedLink(null)}
                  disabled={markingReceived}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmReceived}
                  disabled={markingReceived}
                  className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  {markingReceived
                    ? "Processing..."
                    : "Confirm & Record Income"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
