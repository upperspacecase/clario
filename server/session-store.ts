export type TranscriptLine = {
  who: "agent" | "user";
  text: string;
  ts: number;
};

/* ------------------------------------------------------------------ */
/* Block-based report — the model composes any sequence of blocks.     */
/* Each block has a discriminator `type`; other fields are optional   */
/* and interpreted per type by the renderer.                           */
/* ------------------------------------------------------------------ */

export type ToolRec = {
  name: string;
  why: string;
  url?: string;
  price?: string;
};

export type ActionItem = {
  action: string;
  why: string;
  when?: string;
};

export type ReportBlock = {
  type:
    | "heading"
    | "paragraph"
    | "bullets"
    | "problem"
    | "tools"
    | "actions"
    | "callout";
  text?: string; // heading, paragraph, callout
  items?: string[]; // bullets
  title?: string; // problem, actions
  body?: string; // problem
  intro?: string; // tools
  tools?: ToolRec[]; // tools
  actions?: ActionItem[]; // actions
  tone?: "next-step" | "note" | "watch"; // callout
};

export type GeneratedReport = {
  language: string;
  title: string;
  blocks: ReportBlock[];
};

export type SessionState = {
  id: string;
  createdAt: number;
  language: string | null;
  transcript: TranscriptLine[];
  endedAt: number | null;
  report: GeneratedReport | null;
  reportStatus: "pending" | "generating" | "ready" | "failed";
  reportError?: string;
};

const store = new Map<string, SessionState>();

export const sessionStore = {
  create(id: string): SessionState {
    const session: SessionState = {
      id,
      createdAt: Date.now(),
      language: null,
      transcript: [],
      endedAt: null,
      report: null,
      reportStatus: "pending",
    };
    store.set(id, session);
    return session;
  },

  get(id: string): SessionState | undefined {
    return store.get(id);
  },

  appendTranscript(id: string, line: TranscriptLine) {
    const s = store.get(id);
    if (!s) return;
    const last = s.transcript[s.transcript.length - 1];
    if (last && last.who === line.who && line.ts - last.ts < 1500) {
      last.text += line.text;
      last.ts = line.ts;
    } else {
      s.transcript.push(line);
    }
  },

  setLanguage(id: string, language: string) {
    const s = store.get(id);
    if (s && !s.language) s.language = language;
  },

  markEnded(id: string) {
    const s = store.get(id);
    if (s && !s.endedAt) s.endedAt = Date.now();
  },

  setReportStatus(
    id: string,
    status: SessionState["reportStatus"],
    error?: string
  ) {
    const s = store.get(id);
    if (s) {
      s.reportStatus = status;
      if (error) s.reportError = error;
    }
  },

  setReport(id: string, report: GeneratedReport) {
    const s = store.get(id);
    if (s) {
      s.report = report;
      s.reportStatus = "ready";
    }
  },
};
