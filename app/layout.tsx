import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://blood-strike-league.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Strike League | Blood Strike Community League",
    template: "%s | Strike League",
  },
  description:
    "Join the Strike League Blood Strike community for competitive 1v1 matches, team duels, fixtures, live standings and player discussions.",
  applicationName: "Strike League",
  keywords: [
    "Blood Strike",
    "Strike League",
    "Blood Strike league",
    "Blood Strike tournament",
    "gaming community",
  ],
  authors: [{ name: "Strike League" }],
  creator: "Strike League",
  publisher: "Strike League",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Strike League",
    title: "Strike League | Blood Strike Community League",
    description:
      "Compete in 1v1 matches and team duels, follow fixtures and standings, and connect with the Strike League community.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary",
    title: "Strike League | Blood Strike Community League",
    description:
      "Competitive Blood Strike matches, team duels, fixtures, standings and community discussions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "gaming",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
