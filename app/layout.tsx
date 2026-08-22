import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hours — Find the workflow costing your real-estate team most.",
  description:
    "A free phone assessment for real-estate teams. Ten minutes on the workflow you choose, a one-page report within the hour, and a $497 Full Assessment when you want the whole operation mapped.",
  openGraph: {
    title: "Hours — Find the workflow costing your real-estate team most.",
    description:
      "A free phone assessment for real-estate teams. Ten minutes on one workflow, a one-page report within the hour.",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
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
