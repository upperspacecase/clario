export const dynamic = "force-dynamic";

export default function ThanksPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[760px] items-center px-[clamp(16px,4vw,48px)] py-[clamp(24px,5vw,72px)]">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="border border-[#27272a] bg-black px-[clamp(20px,3vw,40px)] py-[clamp(36px,6vw,72px)] text-center">
          <div className="mb-6 inline-flex items-center justify-center gap-1.5">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-500">
              Recording received
            </p>
          </div>
          <h1
            className="mb-5 font-extrabold tracking-tighter text-white"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
            }}
          >
            Thanks for the time.
          </h1>
          <p className="mx-auto max-w-[460px] text-[15px] leading-[1.6] text-white/65">
            Our team is reviewing the recording and writing your report. You will
            receive an email at the address you provided when it is ready, with a
            link to view the report and book a follow-up call.
          </p>
          <p className="mx-auto mt-6 max-w-[460px] text-[14px] leading-[1.6] text-white/45">
            Reports usually take a few hours. If you do not see anything in 24
            hours, check spam or write to hi@gethours.org.
          </p>
        </div>
      </div>
    </main>
  );
}
