import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { sendFullIntakeInvite } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Bad signature: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed": {
        console.warn(`[stripe-webhook] payment failed event=${event.type}`);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] handler failed:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // "paid" = card charged. "no_payment_required" = 100%-off promo code,
  // total dropped to $0, no Payment Intent. Both count as "they're done
  // and the report should ship."
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  const assessmentId =
    session.client_reference_id ??
    (session.metadata && (session.metadata.assessmentId as string)) ??
    null;
  if (!assessmentId) {
    console.warn(
      `[stripe-webhook] checkout.session.completed without assessmentId session=${session.id}`,
    );
    return;
  }

  const amountTotal = session.amount_total;
  const amountPaidUsd =
    typeof amountTotal === "number" ? amountTotal / 100 : null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const docRef = adminDb().collection("assessments").doc(assessmentId);
  await docRef.update({
    paidAt: FieldValue.serverTimestamp(),
    amountPaidUsd,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
  });

  console.log(
    `[stripe-webhook] paid assessment=${assessmentId} amount=${amountPaidUsd} pi=${paymentIntentId}`,
  );

  // Paid Full Assessment (PRD): move to awaiting the 45-minute intake and
  // send the invite. Duplicate webhook deliveries are safe — the email only
  // fires on the first transition out of awaiting_payment.
  const doc = (await docRef.get()).data() ?? {};
  if (doc.tier === "full" && doc.status === "awaiting_payment") {
    await docRef.update({ status: "awaiting_details" });
    void logEvent("full_assessment_paid", { assessmentId });
    const email = doc.clientEmail as string | null;
    if (email) {
      await sendFullIntakeInvite({
        to: email,
        clientName: (doc.clientName as string | null) ?? "",
        shareId: (doc.shareId as string) ?? "",
      });
    }
  }
}
