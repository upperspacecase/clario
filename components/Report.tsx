import type {
  FourDayPlanItem,
  Headline,
  PainPoint,
  Recommendation,
  Upsell,
} from "@/lib/types";

export interface ReportData {
  shareId: string;
  clientName: string;
  businessName: string;
  generatedAt: string | null;
  headline: Headline;
  executiveSummary: string;
  painPoints: PainPoint[];
  recommendations: Recommendation[];
  fourDayPlan: FourDayPlanItem[];
  upsells: Upsell[];
  bookingUrl: string;
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtHours = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} hrs`;

export function Report({ data }: { data: ReportData }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <Header
        clientName={data.clientName}
        businessName={data.businessName}
        generatedAt={data.generatedAt}
      />

      <HeadlineBlock headline={data.headline} />

      <Section title="What we heard">
        <p className="font-[Inter] text-[15px] leading-[1.7] text-on-surface-variant">
          {data.executiveSummary}
        </p>
      </Section>

      <Section title="Where time is going">
        <PainPointsList painPoints={data.painPoints} />
      </Section>

      <Section title="Effort × impact">
        <EffortImpactMatrix painPoints={data.painPoints} />
      </Section>

      <Section title="Quick wins">
        {data.recommendations.length === 0 ? (
          <p className="font-[Inter] text-[14px] text-on-surface-variant">
            No off-the-shelf quick wins for these specific pain points — see
            the bigger plays below instead.
          </p>
        ) : (
          <RecommendationList
            recommendations={data.recommendations}
            painPoints={data.painPoints}
          />
        )}
      </Section>

      {data.fourDayPlan.length > 0 && (
        <Section title="Your 4-day plan">
          <FourDayPlanList items={data.fourDayPlan} />
        </Section>
      )}

      {data.upsells.length > 0 && (
        <Section title="Bigger plays">
          <UpsellList upsells={data.upsells} />
        </Section>
      )}

      <Section title="The numbers">
        <FinancialTable
          recommendations={data.recommendations}
          headline={data.headline}
        />
      </Section>

      <BookingBlock bookingUrl={data.bookingUrl} />
    </article>
  );
}

function Header({
  clientName,
  businessName,
  generatedAt,
}: {
  clientName: string;
  businessName: string;
  generatedAt: string | null;
}) {
  return (
    <header className="mb-10 border-b border-outline-variant pb-8">
      <p className="mb-2 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-outline">
        Hours assessment
      </p>
      <h1 className="font-serif text-[clamp(28px,5vw,44px)] leading-[1.1] tracking-tight text-on-surface">
        {businessName}
      </h1>
      <p className="mt-3 font-[Inter] text-[14px] text-on-surface-variant">
        Prepared for {clientName}
        {generatedAt ? ` · ${generatedAt}` : ""}
      </p>
    </header>
  );
}

function HeadlineBlock({ headline }: { headline: Headline }) {
  return (
    <div className="mb-12 rounded-lg border border-outline-variant bg-surface-container-low p-6 sm:p-8">
      <p className="mb-1 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-outline">
        Net monthly value
      </p>
      <p className="font-serif text-[clamp(36px,7vw,64px)] leading-none text-primary">
        {fmtMoney(headline.netMonthly)}
      </p>
      <p className="mt-2 font-[Inter] text-[13px] text-on-surface-variant">
        {fmtHours(headline.hoursPerWeek)}/week back · {fmtMoney(headline.annualized)}/year
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-outline-variant/60 pt-6 sm:grid-cols-4">
        <Stat label="Hours/week" value={fmtHours(headline.hoursPerWeek)} />
        <Stat label="Monthly value" value={fmtMoney(headline.monthlyValue)} />
        <Stat label="Tool cost" value={`${fmtMoney(headline.monthlyToolCost)}/mo`} />
        <Stat label="Hourly rate" value={`${fmtMoney(headline.hourlyRateUsed)}/hr`} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-[Inter] text-[11px] font-semibold uppercase tracking-[0.14em] text-outline">
        {label}
      </dt>
      <dd className="mt-1 font-[Inter] text-[15px] font-semibold text-on-surface">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-5 font-serif text-[22px] text-on-surface md:text-[26px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PainPointsList({ painPoints }: { painPoints: PainPoint[] }) {
  return (
    <ul className="space-y-4">
      {painPoints.map((p) => (
        <li
          key={p.id}
          className="rounded-md border border-outline-variant bg-surface p-5"
        >
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-[Inter] text-[15px] font-semibold text-on-surface">
              {p.description}
            </p>
            {p.isQuickWin && (
              <span className="inline-flex items-center rounded border border-primary/40 bg-primary/5 px-2 py-0.5 font-[Inter] text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                Quick win
              </span>
            )}
          </div>
          {p.verbatimQuote && (
            <blockquote className="mb-3 border-l-2 border-outline-variant pl-3 font-[Inter] text-[14px] italic leading-[1.55] text-on-surface-variant">
              “{p.verbatimQuote}”
            </blockquote>
          )}
          <p className="font-[Inter] text-[12px] uppercase tracking-[0.06em] text-outline">
            {p.frequency} · {fmtHours(p.hoursPerWeek)}/wk · {p.category.replace(/_/g, " ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

function EffortImpactMatrix({ painPoints }: { painPoints: PainPoint[] }) {
  // 3x3 grid; we only label the four corners. (1,3) = high-impact / low-effort
  // = top-right "quick wins". (3,3) = bigger plays. (1,1) = small wins.
  const cells: Array<{ effort: 1 | 2 | 3; impact: 1 | 2 | 3 }> = [];
  for (let impact = 3 as 1 | 2 | 3; impact >= 1; impact--) {
    for (let effort = 1 as 1 | 2 | 3; effort <= 3; effort++) {
      cells.push({ effort, impact });
      if (effort === 3) break;
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative grid min-w-[320px] grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_1fr_1fr_1fr] gap-1.5">
        <div />
        <Axis label="Low effort" />
        <Axis label="Medium" />
        <Axis label="High effort" />
        {([3, 2, 1] as const).map((impact) => (
          <RowFragment
            key={impact}
            impact={impact}
            painPoints={painPoints.filter((p) => p.impactScore === impact)}
          />
        ))}
      </div>
      <p className="mt-3 font-[Inter] text-[12px] text-outline">
        Top-right cell = high impact, low effort. Start there.
      </p>
    </div>
  );
}

function Axis({ label }: { label: string }) {
  return (
    <p className="px-1 font-[Inter] text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
      {label}
    </p>
  );
}

function RowFragment({
  impact,
  painPoints,
}: {
  impact: 1 | 2 | 3;
  painPoints: PainPoint[];
}) {
  const impactLabel = impact === 3 ? "High impact" : impact === 2 ? "Medium" : "Low impact";
  return (
    <>
      <p className="self-center pr-2 font-[Inter] text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
        {impactLabel}
      </p>
      {([1, 2, 3] as const).map((effort) => {
        const inCell = painPoints.filter((p) => p.effortScore === effort);
        const isQuickWinCell = effort === 1 && impact === 3;
        return (
          <div
            key={effort}
            className={`min-h-[64px] rounded-md border p-2 ${
              isQuickWinCell
                ? "border-primary/40 bg-primary/5"
                : "border-outline-variant bg-surface"
            }`}
          >
            <div className="space-y-1">
              {inCell.map((p) => (
                <p
                  key={p.id}
                  className="font-[Inter] text-[11px] leading-snug text-on-surface"
                >
                  · {p.description}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function RecommendationList({
  recommendations,
  painPoints,
}: {
  recommendations: Recommendation[];
  painPoints: PainPoint[];
}) {
  const painById = new Map(painPoints.map((p) => [p.id, p]));
  return (
    <ul className="space-y-4">
      {recommendations.map((r) => {
        const pain = painById.get(r.painPointId);
        return (
          <li
            key={r.id}
            className="rounded-md border border-outline-variant bg-surface p-5"
          >
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <a
                href={r.toolUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-[Inter] text-[16px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                {r.toolName}
              </a>
              <span className="font-[Inter] text-[12px] text-outline">
                {r.pricing} · saves ~{fmtHours(r.timeSavedHoursPerWeek)}/wk
              </span>
            </div>
            {pain && (
              <p className="mb-2 font-[Inter] text-[12px] uppercase tracking-[0.08em] text-outline">
                For: {pain.description}
              </p>
            )}
            <p className="font-[Inter] text-[14px] leading-[1.6] text-on-surface-variant">
              {r.whyItFits}
            </p>
            {r.installSteps.length > 0 && (
              <ol className="mt-3 list-decimal space-y-1 pl-5">
                {r.installSteps.map((step, i) => (
                  <li
                    key={i}
                    className="font-[Inter] text-[13px] leading-[1.55] text-on-surface-variant"
                  >
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FourDayPlanList({ items }: { items: FourDayPlanItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li
          key={item.day}
          className="flex gap-4 rounded-md border border-outline-variant bg-surface p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-[Inter] text-[13px] font-semibold text-on-primary-fixed">
            D{item.day}
          </div>
          <div>
            <p className="font-[Inter] text-[15px] font-semibold text-on-surface">
              {item.action}
            </p>
            {item.toolName && (
              <p className="mt-1 font-[Inter] text-[12px] uppercase tracking-[0.08em] text-outline">
                {item.toolName}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function UpsellList({ upsells }: { upsells: Upsell[] }) {
  return (
    <ul className="space-y-4">
      {upsells.map((u) => (
        <li
          key={u.id}
          className="rounded-md border border-outline-variant bg-surface-container-low p-5"
        >
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-[Inter] text-[16px] font-semibold text-on-surface">
              {u.title}
            </p>
            <span className="font-[Inter] text-[12px] text-outline">
              {fmtMoney(u.valueRangeMin)}–{fmtMoney(u.valueRangeMax)}
            </span>
          </div>
          <p className="mb-2 font-[Inter] text-[13px] leading-[1.6] text-on-surface-variant">
            <span className="font-semibold text-on-surface">Problem: </span>
            {u.problem}
          </p>
          <p className="font-[Inter] text-[13px] leading-[1.6] text-on-surface-variant">
            <span className="font-semibold text-on-surface">What we&apos;d build: </span>
            {u.proposedSolution}
          </p>
        </li>
      ))}
    </ul>
  );
}

function FinancialTable({
  recommendations,
  headline,
}: {
  recommendations: Recommendation[];
  headline: Headline;
}) {
  const rows = recommendations.map((r) => {
    const monthlyValue = r.timeSavedHoursPerWeek * 4 * headline.hourlyRateUsed;
    const monthlyCost = r.monthlyPrice ?? 0;
    return {
      tool: r.toolName,
      hoursPerWeek: r.timeSavedHoursPerWeek,
      monthlyValue,
      monthlyCost,
      net: monthlyValue - monthlyCost,
    };
  });

  return (
    <div className="overflow-x-auto rounded-md border border-outline-variant bg-surface">
      <table className="min-w-full text-left font-[Inter] text-[13px]">
        <thead className="border-b border-outline-variant bg-surface-container-low">
          <tr>
            <Th>Tool</Th>
            <Th align="right">Hrs/wk</Th>
            <Th align="right">Value/mo</Th>
            <Th align="right">Cost/mo</Th>
            <Th align="right">Net/mo</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.tool}
              className="border-b border-outline-variant/60 last:border-b-0"
            >
              <Td>{r.tool}</Td>
              <Td align="right">{fmtHours(r.hoursPerWeek)}</Td>
              <Td align="right">{fmtMoney(r.monthlyValue)}</Td>
              <Td align="right">{fmtMoney(r.monthlyCost)}</Td>
              <Td align="right" bold>
                {fmtMoney(r.net)}
              </Td>
            </tr>
          ))}
          <tr className="bg-surface-container-low">
            <Td bold>Total</Td>
            <Td align="right" bold>
              {fmtHours(headline.hoursPerWeek)}
            </Td>
            <Td align="right" bold>
              {fmtMoney(headline.monthlyValue)}
            </Td>
            <Td align="right" bold>
              {fmtMoney(headline.monthlyToolCost)}
            </Td>
            <Td align="right" bold>
              {fmtMoney(headline.netMonthly)}
            </Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 font-semibold uppercase tracking-[0.06em] text-outline ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  bold,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  bold?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"} ${
        bold ? "font-semibold text-on-surface" : "text-on-surface-variant"
      }`}
    >
      {children}
    </td>
  );
}

function BookingBlock({ bookingUrl }: { bookingUrl: string }) {
  if (!bookingUrl) return null;
  return (
    <section className="mt-12 rounded-lg border border-primary bg-primary/5 p-6 text-center sm:p-8">
      <h2 className="mb-2 font-serif text-[22px] text-on-surface md:text-[26px]">
        Book your follow-up
      </h2>
      <p className="mx-auto mb-5 max-w-md font-[Inter] text-[14px] leading-[1.6] text-on-surface-variant">
        A free 30-minute walkthrough where we go through this report together
        and answer your questions.
      </p>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-2 bg-primary-container px-8 py-4 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-80"
      >
        Pick a time
      </a>
    </section>
  );
}
