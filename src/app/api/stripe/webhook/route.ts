import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!isStripeConfigured || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook Stripe non configuré." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signature invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: "not paid" });
  }

  const metadata = session.metadata ?? {};
  const playerId = metadata.player_id;
  const coachId = metadata.coach_id;
  const sessionDate = metadata.session_date;
  const sessionTime = metadata.session_time;
  const durationMinutes = Number(metadata.duration_minutes ?? "60");
  const priceCents = Number(metadata.price_cents ?? "0");

  if (!playerId || !coachId || !sessionDate || !sessionTime) {
    return NextResponse.json(
      { error: "Metadata Stripe incomplète." },
      { status: 400 },
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const priceEuros = Math.round(priceCents / 100);

  const admin = getSupabaseAdmin();
  const { error } = await admin.rpc("create_paid_booking", {
    p_player_id: playerId,
    p_coach_id: coachId,
    p_date: sessionDate,
    p_time: sessionTime,
    p_duration_minutes: durationMinutes,
    p_price: priceEuros,
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId,
  });

  if (error) {
    // SLOT_ALREADY_BOOKED ou erreur DB — on log et répond 500 pour que Stripe retry
    console.error("[stripe webhook] create_paid_booking failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
