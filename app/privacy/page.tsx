import Link from "next/link";

export const metadata = {
  title: "Hours — Privacy & data retention",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "What we collect",
    body: [
      "The details you enter on our forms (name, business, email, phone, country, team size), your answers about how your business runs, and — for phone assessments — a transcript of the call. Calls are placed only when you request one, and Sam identifies itself as an AI interviewer at the start of the call.",
      "We ask about your operations, not your clients. Please don't share client names, property addresses or transaction documents on a call — if they come up, they can be removed on request.",
    ],
  },
  {
    h: "How it's used",
    body: [
      "Your answers are used to build your assessment and for nothing else. Reports are private, reachable only through an unguessable link sent to your email.",
      "Aggregate, de-identified patterns (never your name, business, tools or numbers) may inform how we improve the assessment. No other customer will ever see your data.",
    ],
  },
  {
    h: "Retention",
    body: [
      "Call transcripts and audio: deleted automatically 12 months after the call.",
      "Assessment records and reports: kept while your report link remains active, so you can return to it.",
      "Consent records: kept as proof of lawful processing.",
    ],
  },
  {
    h: "Your controls",
    body: [
      "You can ask us to correct an answer, delete your transcript, or delete everything we hold about you. Reply to any Hours email or write to tay@life-time.co — deletion requests are processed within 30 days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto w-full max-w-[680px] px-5 py-12 md:py-16">
        <Link href="/" className="mb-10 block font-serif text-2xl lowercase">
          hrs
        </Link>
        <h1 className="mb-8 text-[32px] font-bold tracking-[-0.02em]">
          Privacy & data retention
        </h1>
        {SECTIONS.map((s) => (
          <section key={s.h} className="mb-8">
            <h2 className="mb-3 text-lg font-bold">{s.h}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 30)} className="mb-3 text-[15px] leading-[1.7] text-[#476582]">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="text-[12px] text-[#6B8199]">Last updated 22 August 2026.</p>
      </main>
    </div>
  );
}
