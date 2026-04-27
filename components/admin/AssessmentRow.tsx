import Link from "next/link";
import type { AssessmentStatus } from "@/lib/types";
import { StatusChip } from "./StatusChip";

export interface AssessmentRowData {
  id: string;
  shareId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  businessName: string | null;
  industry: string | null;
  callerRole: string | null;
  status: AssessmentStatus;
  startedAt: Date | null;
  createdAt: Date | null;
  durationSec: number | null;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelative(date: Date | null): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function AssessmentRow({ row }: { row: AssessmentRowData }) {
  const when = row.startedAt ?? row.createdAt;
  const showLink = row.status === "complete" && !!row.shareId;

  return (
    <div className="flex items-start gap-4 border-b border-outline-variant/60 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-on-surface">
          {row.clientName ?? <span className="text-on-surface-variant">—</span>}
        </div>
        <div className="text-sm text-on-surface-variant">
          {row.businessName ?? "—"}
          {row.industry ? <span className="text-outline"> · {row.industry}</span> : null}
          {row.callerRole ? <span className="text-outline"> · {row.callerRole}</span> : null}
        </div>
      </div>

      <div className="w-28 flex-shrink-0">
        <StatusChip status={row.status} />
      </div>

      <div className="hidden w-32 flex-shrink-0 text-sm text-on-surface-variant sm:block">
        <div title={when ? when.toLocaleString() : undefined}>{formatRelative(when)}</div>
      </div>

      <div className="hidden w-16 flex-shrink-0 text-right text-sm tabular-nums text-on-surface-variant md:block">
        {formatDuration(row.durationSec)}
      </div>

      <div className="w-20 flex-shrink-0 text-right text-sm">
        {showLink ? (
          <Link
            href={`/report/${row.shareId}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            Report →
          </Link>
        ) : (
          <span className="text-outline">—</span>
        )}
      </div>
    </div>
  );
}
