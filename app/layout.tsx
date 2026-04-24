import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clario — Five minutes on the phone. Three AI tools that fit your restaurant.",
  description:
    "Clario is a voice agent for restaurant owners in non-English-speaking countries. Call us in your language; we send a plain-language report of AI tools that fit your restaurant.",
  openGraph: {
    title: "Clario — AI tools for your restaurant, in your language.",
    description:
      "Five minutes on the phone. Three AI tools that fit your restaurant. In Spanish, Portuguese, Italian, Vietnamese, and more.",
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
      <body className="relative">{children}</body>
    </html>
  );
}
