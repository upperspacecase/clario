// Function declarations exposed to the Live model.

import { Type, type FunctionDeclaration } from "@google/genai";

export const END_INTERVIEW_DECLARATION: FunctionDeclaration = {
  name: "end_interview",
  description:
    "Call this after you have delivered the closing line in the wrap. This signals the system to stop the recording and trigger the report pipeline.",
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
