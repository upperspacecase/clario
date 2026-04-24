// In-memory session store for the prototype.
// One Node process = one store. Not durable. Fine for a demo.

export type TranscriptLine = {
  who: "agent" | "user";
  text: string;
  ts: number;
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

export type GeneratedReport = {
  language: string;
  executiveSummary: string;
  businessSnapshot: string;
  topProblems: {
    problem: string;
    whyItMatters: string;
    recommendations: {
      name: string;
      why: string;
      url: string;
      startingPrice?: string;
    }[];
    nextStepThisWeek: string;
  }[];
  thirtyDayPlan: { priority: number; action: string; why: string }[];
  watchItems: string[];
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
    // Merge consecutive chunks from the same speaker into the same line
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
