import "@/styles/globals.css";

import type { Metadata } from "next";
import { geist } from "./fonts";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Twigg",
  description: "AI-powered personal finance manager",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(geist.variable, "antialiased")}>
      <body>
        {children}
        <Toaster position="bottom-right" expand={false} richColors={true} />
      </body>
    </html>
  );
}
