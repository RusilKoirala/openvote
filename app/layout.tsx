import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Nepal 2082 Election Results — Live",
    template: "%s | Nepal 2082 Elections",
  },
  description:
    "Live election results for Nepal 2082 BS general elections. Track real-time vote counts, party standings, and constituency-wise results from the Nepal Election Commission.",
  metadataBase: new URL("https://election.rusil.me"),
  keywords: [
    "Nepal election 2082",
    "Nepal election results",
    "Nepal vote count live",
    "नेपाल निर्वाचन २०८२",
    "ECS Nepal results",
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
    other: [
      { rel: "manifest", url: "/favicon_io/site.webmanifest" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Nepal 2082 Election Results",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nepal 2082 Election Results — Live",
    description: "Live election results for Nepal's 2082 BS general elections.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
