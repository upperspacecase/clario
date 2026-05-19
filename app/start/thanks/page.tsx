import { PhoneSteps } from "@/components/PhoneSteps";

export const dynamic = "force-dynamic";

export default function ThanksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="w-full max-w-[520px]">
        <div className="mb-4">
          <PhoneSteps current={3} done />
        </div>
        <div className="rounded-lg border border-[#27272a] bg-[#0a0a0a] p-6 text-center md:p-8">
          <div className="mb-4 inline-flex items-center justify-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-500">
              Recording received
            </p>
          </div>
          <h1 className="mb-3 text-[26px] font-extrabold leading-tight tracking-tight text-white">
            Thanks for the time.
          </h1>
          <p className="mx-auto max-w-[380px] text-[14px] leading-snug text-white/65">
            Our team is reviewing the recording and writing your report. You
            will receive an email at the address you provided within 24 hours,
            with a link to view the report and book a follow-up call.
          </p>
          <p className="mx-auto mt-4 max-w-[380px] text-[12px] leading-snug text-white/45">
            If you don&rsquo;t see anything within 24 hours, check spam or
            write to hi@gethours.org.
          </p>
        </div>
      </div>
    </main>
  );
}
