// OpenAI Realtime SIP entry point. Twilio dials the caller and legs the call
// to sip:$PROJECT_ID@sip.api.openai.com, OpenAI fires realtime.call.incoming
// here, and we accept it with the active Sam prompt.
//
// Unlike the Gemini path there is no audio relay — SRTP flows Twilio <-> OpenAI
// directly, so nothing in this repo touches the media.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getActivePrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1";

export async function POST(req: Request) {
  const secret = process.env.OPENAI_WEBHOOK_SECRET;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!secret || !apiKey) {
    console.error("[openai-webhook] missing OPENAI_WEBHOOK_SECRET or OPENAI_API_KEY");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Signature verification needs the exact bytes, so read the body as text.
  const raw = await req.text();
  const client = new OpenAI({ apiKey, webhookSecret: secret });

  let event;
  try {
    event = await client.webhooks.unwrap(raw, req.headers);
  } catch (err) {
    console.error("[openai-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "realtime.call.incoming") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const callId = event.data.call_id;
  const from = event.data.sip_headers.find((h) => h.name.toLowerCase() === "from")?.value ?? "";
  console.log(`[openai-webhook] incoming call=${callId} from=${from}`);

  const prompt = await getActivePrompt();
  if (!prompt) {
    // No prompt means no agent. Decline rather than answering with silence.
    await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status_code: 503 }),
    }).catch(() => undefined);
    console.error("[openai-webhook] no active prompt — rejected call");
    return NextResponse.json({ error: "no_active_prompt" }, { status: 500 });
  }

  const instructions = prompt.persona.trim()
    ? `${prompt.persona.trim()}\n\n---\n\n${prompt.prompt}`
    : prompt.prompt;

  const res = await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "realtime", model: REALTIME_MODEL, instructions }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[openai-webhook] accept failed ${res.status}: ${body}`);
    return NextResponse.json({ error: "accept_failed" }, { status: 502 });
  }

  console.log(`[openai-webhook] accepted call=${callId} model=${REALTIME_MODEL} promptId=${prompt.id}`);
  return NextResponse.json({ ok: true, callId });
}
