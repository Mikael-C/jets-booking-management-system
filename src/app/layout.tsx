import type { Metadata } from "next";
import "./globals.css";
import { AviationProvider } from "@/lib/aviationContext";
import Toaster from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Orbelo | Private Jet Booking & Charter Management",
  description: "Executive Private Jet Booking Management, Flight Operations, Quotations, Invoices, Flight Briefs & Charter Agreements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[var(--paper)] text-[var(--ink)]">
        <AviationProvider>{children}</AviationProvider>
        <Toaster />
      </body>
    </html>
  );
}
