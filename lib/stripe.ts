import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const FALLBACK_PRICE_USD = 497;

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(key);
  return cached;
}

interface GlobalConfig {
  assessmentPriceUsd?: number;
  freePilotMode?: boolean;
}

async function readGlobalConfig(): Promise<GlobalConfig> {
  try {
    const snap = await adminDb().collection("config").doc("global").get();
    if (!snap.exists) return {};
    return (snap.data() ?? {}) as GlobalConfig;
  } catch {
    return {};
  }
}

export async function getAssessmentPriceCents(): Promise<number> {
  const cfg = await readGlobalConfig();
  const usd =
    typeof cfg.assessmentPriceUsd === "number" && cfg.assessmentPriceUsd > 0
      ? cfg.assessmentPriceUsd
      : FALLBACK_PRICE_USD;
  return Math.round(usd * 100);
}

export async function isFreePilotMode(): Promise<boolean> {
  const cfg = await readGlobalConfig();
  return cfg.freePilotMode === true;
}

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3041"
  );
}
