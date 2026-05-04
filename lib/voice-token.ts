import { SignJWT, jwtVerify } from "jose";
import type { VoiceSessionTokenPayload } from "./types";

const TOKEN_TTL_SECONDS = 60 * 30; // 30 min

function secretKey(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export async function signVoiceSessionToken(
  assessmentId: string,
  shareId: string,
  voice?: string,
): Promise<string> {
  const claims: Record<string, unknown> = { assessmentId, shareId };
  if (voice) claims.voice = voice;
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyVoiceSessionToken(
  token: string,
): Promise<VoiceSessionTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  if (typeof payload.assessmentId !== "string" || typeof payload.shareId !== "string") {
    throw new Error("Invalid voice session token payload");
  }
  return payload as unknown as VoiceSessionTokenPayload;
}
