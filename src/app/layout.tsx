import "@/styles/globals.css";

import type { Metadata } from "next";
import { geist } from "./fonts";

export const metadata: Metadata = {
  title: "Twigg",
  description: "AI-powered personal finance manager",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
