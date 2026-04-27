import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = {
  title: "Contact — hrs",
};

export default function Contact() {
  return (
    <PlaceholderPage
      eyebrow="Contact"
      title="Get in touch."
      body="The fastest way to begin is to take the audit. If you'd rather speak with a human first, write to hello@hrs.studio and we'll be in touch within one business day."
    />
  );
}
