import Link from "next/link";
import { PromptsClient } from "./PromptsClient";

export const dynamic = "force-dynamic";

export default function AdminPromptsPage() {
  return (
    <main className="min-h-screen bg-surface page-light">
      <div className="mx-auto max-w-content px-[clamp(20px,5vw,48px)] py-12">
        <Link
          href="/admin"
          className="text-sm text-on-surface-variant hover:text-on-surface"
        >
          ← Admin
        </Link>
        <header className="mt-2 border-b border-outline-variant pb-6">
          <h1 className="font-display text-headline-md text-on-surface">
            Prompts
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            The active prompt is what the agent uses on every call.
          </p>
        </header>
        <PromptsClient />
      </div>
    </main>
  );
}
