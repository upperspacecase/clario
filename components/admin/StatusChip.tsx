import type { AssessmentStatus } from "@/lib/types";

const STATUS_LABEL: Record<AssessmentStatus, string> = {
  in_call: "In call",
  pending_processing: "Pending",
  processing: "Processing",
  manual_review: "Review",
  complete: "Complete",
  failed: "Failed",
};

const STATUS_CLASSES: Record<AssessmentStatus, string> = {
  in_call: "bg-secondary-container text-on-secondary-container",
  pending_processing: "bg-tertiary-container text-on-tertiary-container",
  processing: "bg-tertiary-container text-on-tertiary-container",
  manual_review: "bg-primary-fixed text-on-primary-fixed-variant",
  complete: "bg-primary text-on-primary",
  failed: "bg-error-container text-on-error-container",
};

export function StatusChip({ status }: { status: AssessmentStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] " +
        STATUS_CLASSES[status]
      }
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
