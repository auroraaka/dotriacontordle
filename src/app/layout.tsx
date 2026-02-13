import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dotriacontordle.com"),
  title: "Dotriacontordle",
  description:
    "A synchronized multi-board lexicon challenge where each guess echoes across the entire grid.",
  keywords: ["word game", "puzzle", "dotriacontordle", "multi-board", "daily puzzle", "word strategy"],
  authors: [{ name: "Dotriacontordle" }],
  applicationName: "Dotriacontordle",
  appleWebApp: {
    title: "Dotriacontordle",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Dotriacontordle",
    siteName: "Dotriacontordle",
    description: "A synchronized multi-board lexicon challenge where each guess echoes across the entire grid.",
    type: "website",
    url: "https://dotriacontordle.com",
    images: ["/logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dotriacontordle",
    description: "A synchronized multi-board lexicon challenge where each guess echoes across the entire grid.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
