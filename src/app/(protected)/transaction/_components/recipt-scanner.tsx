"use client";

import { useRef, useEffect } from "react";
import { toast } from "sonner";
import { useFetch } from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera } from "lucide-react";

export function ReceiptScanner({
  onScanComplete,
}: {
  onScanComplete: (data: {
    amount: number;
    date: string;
    description: string;
    category: string;
  }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    await scanReceiptFn(formData);
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(
        scannedData as {
          amount: number;
          date: string;
          description: string;
          category: string;
        },
      );
      toast.success("Receipt scanned successfully");
    }
  }, [onScanComplete, scanReceiptLoading, scannedData]);

  return (
    <div className="flex items-center gap-4">
      <input
        id="receipt-file-upload"
        name="receipt-file-upload"
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleReceiptScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/40 h-11 w-full gap-2 font-medium shadow-xs transition"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Spinner size={16} />
            <span className="text-xs">Processing Receipt with AI...</span>
          </>
        ) : (
          <>
            <Camera className="text-primary h-4 w-4" />
            <span className="text-xs font-semibold">
              Scan & Auto-Fill Receipt with AI
            </span>
          </>
        )}
      </Button>
    </div>
  );
}
