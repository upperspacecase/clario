import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  getAppOrigin,
  getAssessmentPriceCents,
  getStripe,
  isFreePilotMode,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { assessmentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const assessmentId = body.assessmentId?.trim();
  if (!assessmentId) {
    return NextResponse.json(
      { error: "assessmentId is required" },
      { status: 400 },
    );
  }

  if (await isFreePilotMode()) {
    return NextResponse.json(
      { error: "Payment disabled (free pilot mode)" },
      { status: 400 },
    );
  }

  try {
    const docRef = adminDb().collection("assessments").doc(assessmentId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 },
      );
    }

    const data = snap.data() as Record<string, unknown>;
    if (data.paidAt) {
      return NextResponse.json(
        { error: "Already paid" },
        { status: 409 },
      );
    }

    const clientEmail = (data.clientEmail as string | null) ?? undefined;
    const businessName =
      (data.businessName as string | null) ?? "your business";

    const priceCents = await getAssessmentPriceCents();
    const origin = getAppOrigin();

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: assessmentId,
      customer_email: clientEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: priceCents,
            product_data: {
              name: "Hours assessment",
              description: `Personalized written report for ${businessName}`,
            },
          },
        },
      ],
      metadata: { assessmentId },
      success_url: `${origin}/start/payment/${assessmentId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/start/payment/${assessmentId}`,
    });

    if (session.url) {
      await docRef.update({ stripeCheckoutSessionId: session.id });
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: "Stripe did not return a checkout url" },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
