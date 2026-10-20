import type { Metadata } from "next";
import "./globals.css";
import { AviationProvider } from "@/lib/aviationContext";

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
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-[#F5F2EC] text-[#0F1420] selection:bg-[#C9A052] selection:text-[#0F1420]">
        <AviationProvider>{children}</AviationProvider>
      </body>
    </html>
  );
}
