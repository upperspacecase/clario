import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = {
  title: "Approach — hrs",
};

export default function Approach() {
  return (
    <PlaceholderPage
      eyebrow="Approach"
      title="A short call. A precise diagnosis. An actionable report."
      body="A 30-minute AI-led discovery call surfaces the hours your team is losing. We map those losses against established operational frameworks and return a tactile report with concrete directives — not bloated consulting decks."
    />
  );
}
