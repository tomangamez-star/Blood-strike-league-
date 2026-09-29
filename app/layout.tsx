import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strike League | Blood Strike Community League",
  description: "Fixtures, standings, teams and results for the Strike League.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
