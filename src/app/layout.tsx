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
  title: "Dotriacontordle - 32 Word Puzzle Game",
  description: "The ultimate word puzzle challenge! Guess 32 six-letter words in 37 tries. A Wordle variant for true puzzle enthusiasts.",
  keywords: ["wordle", "word game", "puzzle", "dotriacontordle", "32 words", "word puzzle"],
  authors: [{ name: "Dotriacontordle" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Dotriacontordle - 32 Word Puzzle Game",
    description: "The ultimate word puzzle challenge! Guess 32 six-letter words in 37 tries.",
    type: "website",
    url: "https://dotriacontordle.com",
    images: ["/logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dotriacontordle - 32 Word Puzzle Game",
    description: "The ultimate word puzzle challenge! Guess 32 six-letter words in 37 tries.",
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
