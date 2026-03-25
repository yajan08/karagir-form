import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karagir Mahakumbh 2026 - Registration",
  description: "Register for the Karagir Mahakumbh 2026 Event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
      <body className="min-h-screen flex flex-col selection:bg-[#d96f27]/30 selection:text-[#5c2a18]">
        {children}
      </body>
    </html>
  );
}
