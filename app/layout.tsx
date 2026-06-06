import type { Metadata, Viewport } from "next";
import { Silkscreen, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "creative developer — interactive systems",
  description:
    "creative developer building AI interfaces and interactive systems. a small experimental playground of floating pixel bots.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${silkscreen.variable} ${jbMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
