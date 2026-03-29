import type { Metadata, Viewport } from "next";
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
  title: "Karagir Mahakumbh 2026 - Official Registration",
  description: "Secure your entry for the grand Karagir Mahakumbh 2026 event. Heritage, art, and craft celebration.",
  keywords: ["Karagir", "Mahakumbh", "2026", "Registration", "Event", "Heritage", "Art", "Craft"],
  authors: [{ name: "Karagir Team" }],
  openGraph: {
    title: "Karagir Mahakumbh 2026 Registration",
    description: "Join us for the grand heritage event. Register now to get your entry pass.",
    images: ["/karagir.jpeg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karagir Mahakumbh 2026 Registration",
    description: "Join us for the grand heritage event.",
    images: ["/karagir.jpeg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#8b2323",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
