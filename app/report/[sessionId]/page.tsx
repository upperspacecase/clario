import { ReportView } from "./ReportView";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-[clamp(20px,5vw,48px)] pb-20 pt-[clamp(32px,6vw,64px)]">
      <ReportView sessionId={sessionId} />
    </main>
  );
}
