import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/stripe/connect/status
 * Vérifie le status d'onboarding Stripe du coach connecté.
 * Met à jour coaches.stripe_onboarded si l'état a changé côté Stripe.
 */
export async function GET(request: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: coach } = await admin
    .from("coaches")
    .select("id, stripe_account_id, stripe_onboarded")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!coach) {
    return NextResponse.json({ hasAccount: false, onboarded: false });
  }

  if (!coach.stripe_account_id) {
    return NextResponse.json({ hasAccount: false, onboarded: false });
  }

  // Re-check côté Stripe pour actualiser l'état (l'user peut avoir fini l'onboarding)
  const stripe = getStripe();
  try {
    const account = await stripe.accounts.retrieve(coach.stripe_account_id as string);
    const isFullyOnboarded =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    // Sync DB si l'état a changé
    if (isFullyOnboarded !== coach.stripe_onboarded) {
      await admin
        .from("coaches")
        .update({ stripe_onboarded: isFullyOnboarded })
        .eq("id", coach.id);
    }

    return NextResponse.json({
      hasAccount: true,
      onboarded: isFullyOnboarded,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements?.currently_due ?? [],
    });
  } catch (error) {
    console.error("[stripe connect status] retrieve failed:", error);
    return NextResponse.json(
      { hasAccount: true, onboarded: coach.stripe_onboarded ?? false },
      { status: 200 },
    );
  }
}
