import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = {
  title: "Philosophy — hrs",
};

export default function Philosophy() {
  return (
    <PlaceholderPage
      eyebrow="Philosophy"
      title="Time is the only resource that does not compound when squandered."
      body="hrs is built on the conviction that operational friction is rarely a tooling problem. It is a design problem. Our work is to find the seams where time is leaking and close them with the smallest possible intervention."
    />
  );
}
