import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fff1f2",
};

export const metadata: Metadata = {
  title: "Dumbo - Download Our Private Space | For Gaurai",
  description:
    "A little universe built just for you, Gaurai. Download Dumbo — our private couple app with shared music, live doodles, focus sessions, and encrypted messaging.",
  openGraph: {
    title: "Dumbo - A Private Space for Two",
    description:
      "Download our private couple app. Shared music, real-time canvas, focus timers, and encrypted chat — built exclusively for us.",
    type: "website",
    locale: "en_US",
    siteName: "Dumbo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dumbo - Download Our Private Space",
    description:
      "A private couple app with shared music, live canvas, focus timers, and encrypted messaging.",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
