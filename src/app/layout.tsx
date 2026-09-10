import "@/styles/globals.css";

import type { Metadata } from "next";
import { geist } from "./fonts";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  title: "Twigg - Modern Personal & Business Finance",
  description:
    "Unified finance platform for personal pockets, budgeting, and business operations.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geist.variable, "scrollbar-thin overflow-auto antialiased")}
    >
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" expand={false} richColors={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}
