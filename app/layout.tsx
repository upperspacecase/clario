import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hours — A 12-minute call that finds where AI gives you your time back.",
  description:
    "Hours is a voice-driven AI opportunity assessment. Spend 12 minutes on the phone with Annie. Receive a personalized report of tools and next steps that save you hours every week.",
  openGraph: {
    title: "Hours — Find where AI gives you your time back.",
    description:
      "A 12-minute call. A tailored report. The tools and next steps that save you hours every week.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative overflow-x-hidden" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
