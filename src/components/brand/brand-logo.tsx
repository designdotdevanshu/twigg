import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  href?: string;
  badge?: string;
}

export function BrandLogo({
  className,
  size = "md",
  showWordmark = true,
  href = "/",
  badge,
}: BrandLogoProps) {
  const sizeMap = {
    sm: {
      box: "h-7 w-7 text-xs rounded-lg shadow-xs",
      wordmark: "text-sm",
      badge: "text-[9px] px-1.5 py-0.2",
      gap: "gap-2",
    },
    md: {
      box: "h-8 w-8 text-sm rounded-xl shadow-md shadow-emerald-500/15",
      wordmark: "text-base",
      badge: "text-[10px] px-2 py-0.5",
      gap: "gap-2.5",
    },
    lg: {
      box: "h-11 w-11 text-base rounded-2xl shadow-lg shadow-emerald-500/20",
      wordmark: "text-xl",
      badge: "text-xs px-2.5 py-0.5",
      gap: "gap-3",
    },
  };

  const selectedSize = sizeMap[size];

  const content = (
    <div className={cn("group inline-flex items-center select-none", selectedSize.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 font-black text-slate-950 transition-transform duration-200 group-hover:scale-105",
          selectedSize.box
        )}
      >
        <span>T</span>
      </div>

      {showWordmark && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold tracking-tight text-white transition-colors duration-150 group-hover:text-emerald-300",
              selectedSize.wordmark
            )}
          >
            twigg
          </span>

          {badge && (
            <span
              className={cn(
                "rounded-full border border-emerald-500/30 bg-emerald-500/10 font-semibold tracking-wide text-emerald-400 uppercase",
                selectedSize.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

