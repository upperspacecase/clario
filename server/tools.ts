// Function declarations exposed to the Live model.
// Per your spec: only end_interview. Model uses its own knowledge for
// tool recommendations; no local knowledge base lookup.

import { Type, type FunctionDeclaration } from "@google/genai";

export const END_INTERVIEW_DECLARATION: FunctionDeclaration = {
  name: "end_interview",
  description:
    "Call this when the discovery interview is complete and you have given your 2–3 sentence closing. This signals the system to generate the written report.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description:
          "Short reason for ending: 'covered_phases', 'user_signalled', 'time_limit', or 'user_ended'.",
      },
    },
    required: ["reason"],
  },
};

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  END_INTERVIEW_DECLARATION,
];
