import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f43f5e",
};

export const metadata: Metadata = {
  title: "Dumbo - Private 2-User Hub",
  description:
    "Private, mobile-first, real-time shared digital space for two people. Music, chat, canvas, focus timer, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Dumbo - Private 2-User Hub",
    description:
      "A private, mobile-first, real-time shared digital space for two people.",
    type: "website",
    locale: "en_US",
    siteName: "Dumbo",
  },
  twitter: {
    card: "summary",
    title: "Dumbo - Private 2-User Hub",
    description:
      "A private, mobile-first, real-time shared digital space for two people.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dumbo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased font-sans selection:bg-rose-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

