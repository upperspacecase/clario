import { PromptEditor } from "../PromptEditor";

export const dynamic = "force-dynamic";

export default async function AdminPromptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-surface page-light">
      <div className="mx-auto max-w-content px-[clamp(20px,5vw,48px)] py-12">
        <PromptEditor id={id} />
      </div>
    </main>
  );
}
