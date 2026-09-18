import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapBid",
  description:
    "Photos and a voice note in, an itemized contractor quote out. Built for small Ontario contractors.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body className="bg-gray-100 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
