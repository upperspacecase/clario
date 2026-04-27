import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DonePage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border border-[#27272a] bg-black px-6 py-12 sm:px-10 sm:py-16 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            Thank you
          </p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
            Your report is being prepared
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            We will email you the moment it is ready. You can close this window.
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-[#A28A43] underline"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
