// Save-and-resume token for the written intake (FR-13). Same signing scheme
// as the voice session token, longer TTL: the emailed resume link should
// survive a busy week.

import { SignJWT, jwtVerify } from "jose";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export interface AssessTokenPayload {
  assessmentId: string;
  scope: "intake";
}

export async function signAssessToken(assessmentId: string): Promise<string> {
  return await new SignJWT({ assessmentId, scope: "intake" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAssessToken(token: string): Promise<AssessTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  if (typeof payload.assessmentId !== "string" || payload.scope !== "intake") {
    throw new Error("Invalid assess token payload");
  }
  return payload as unknown as AssessTokenPayload;
}
