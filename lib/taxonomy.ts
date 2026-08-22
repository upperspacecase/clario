// The six-workflow taxonomy from the Hours PRD §4.3. A starting structure —
// review against observed customer language after 30 completed assessments.

export const WORKFLOW_IDS = [
  "lead_generation",
  "client_communication",
  "showings_appointments",
  "transactions_paperwork",
  "listings_marketing",
  "admin_compliance",
] as const;
export type WorkflowId = (typeof WORKFLOW_IDS)[number];

export interface WorkflowDef {
  id: WorkflowId;
  label: string;
  covers: string;
  // Phrasing for the opening process question, in the customer's language.
  processQuestion: string;
}

export const WORKFLOWS: WorkflowDef[] = [
  {
    id: "lead_generation",
    label: "Lead generation and follow-up",
    covers: "Inbound response, prospecting, CRM hygiene, nurture and referrals",
    processQuestion:
      "Walk us through what happens when a new lead comes in — from first contact to follow-up. Where does it break down?",
  },
  {
    id: "client_communication",
    label: "Client communication",
    covers: "Status updates, questions, expectation setting and coordination",
    processQuestion:
      "How do clients get updates from your team today, and what do they chase you for most?",
  },
  {
    id: "showings_appointments",
    label: "Showings and appointments",
    covers: "Scheduling, preparation, travel, consultations and open houses",
    processQuestion:
      "How does a showing get scheduled and prepared today, and where does the time disappear?",
  },
  {
    id: "transactions_paperwork",
    label: "Transactions and paperwork",
    covers: "Contracts, disclosures, deadlines, documents and third parties",
    processQuestion:
      "Walk us through a deal from accepted offer to close — which documents and deadlines eat the most time?",
  },
  {
    id: "listings_marketing",
    label: "Listings and marketing",
    covers: "Listing setup, content, photography, portals, campaigns and materials",
    processQuestion:
      "What does it take to get a new listing live and marketed today, step by step?",
  },
  {
    id: "admin_compliance",
    label: "Administration and compliance",
    covers: "Bookkeeping, records, licensing, compliance, inbox and calendar",
    processQuestion:
      "What admin work fills the gaps in your team's week — inbox, records, compliance, books?",
  },
];

export function getWorkflow(id: string): WorkflowDef | null {
  return WORKFLOWS.find((w) => w.id === id) ?? null;
}

export function isWorkflowId(v: unknown): v is WorkflowId {
  return typeof v === "string" && (WORKFLOW_IDS as readonly string[]).includes(v);
}

// Form question set. One compact set shared across workflows; the process
// question is phrased per workflow above. Simplicity is the spec: five
// questions is the whole free intake.
export interface IntakeQuestion {
  id: "process" | "owner" | "tools" | "time" | "outcome";
  kind: "textarea" | "text" | "time_range";
  label: string;
  placeholder?: string;
  optional?: boolean;
}

export function questionsFor(workflow: WorkflowDef): IntakeQuestion[] {
  return [
    {
      id: "process",
      kind: "textarea",
      label: workflow.processQuestion,
      placeholder: "A few sentences is plenty — plain language, no polish.",
    },
    {
      id: "owner",
      kind: "text",
      label: "Who does most of this work?",
      placeholder: "e.g. me, our admin, split across agents",
    },
    {
      id: "tools",
      kind: "text",
      label: "What tools are involved?",
      placeholder: "e.g. Follow Up Boss, spreadsheets, WhatsApp",
    },
    {
      id: "time",
      kind: "time_range",
      label: "Roughly how many hours a week does your team spend on this?",
    },
    {
      id: "outcome",
      kind: "text",
      label: "If this workflow were fixed, what would be different?",
      placeholder: "e.g. leads answered same-hour without me doing it",
      optional: true,
    },
  ];
}
