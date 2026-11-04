import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

const description =
  "See everything on your home network: device discovery, port scans, traffic analysis and live alerts, with SOC 2 style daily checks. FastAPI, Next.js, PostgreSQL. Try the live demo.";

export const metadata: Metadata = {
  title: "NetSentinel · Home network security monitor",
  description,
  openGraph: {
    type: "website",
    title: "NetSentinel · Home network security monitor",
    description,
    url: "https://saharhalili95.github.io/netsentinel/",
    images: [{ url: "https://saharhalili95.github.io/netsentinel/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
