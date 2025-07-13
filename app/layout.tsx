// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seek | OSRS Clan",
  description: "The official clan website for Seek. Featuring bounty tracking, leaderboards, and member stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased flex flex-col min-h-screen bg-slate-900`}
      >
        {/* This wrapper div allows the main content to grow and push the footer down */}
        <div className="flex-grow">
            {children}
        </div>
        
        {/* Footer is now part of the main layout flow */}
        <Footer />
        
        {/* Cookie Banner will overlay on top of everything at the bottom */}
        <CookieBanner />
      </body>
    </html>
  );
}