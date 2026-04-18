import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/stripe/connect/onboard
 * Crée (ou réutilise) un compte Stripe Connect Express pour le coach
 * connecté, puis renvoie un AccountLink (URL d'onboarding).
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json(
      { error: "Stripe non configuré." },
      { status: 503 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
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
  const { data: coach, error: coachError } = await admin
    .from("coaches")
    .select("id, stripe_account_id, stripe_onboarded, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (coachError) {
    console.error("[stripe connect onboard] coach lookup error:", coachError);
    return NextResponse.json({ error: "Erreur lecture profil coach." }, { status: 500 });
  }

  if (!coach) {
    return NextResponse.json(
      { error: "Aucun profil coach trouvé pour cet utilisateur." },
      { status: 404 },
    );
  }

  const stripe = getStripe();
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  try {
    let accountId = coach.stripe_account_id as string | null;

    // Créer le compte Express si inexistant
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          coach_id: coach.id,
          user_id: user.id,
        },
      });
      accountId = account.id;

      const { error: updateError } = await admin
        .from("coaches")
        .update({ stripe_account_id: accountId })
        .eq("id", coach.id);

      if (updateError) {
        console.error("[stripe connect onboard] save account_id failed:", updateError);
      }
    }

    // Générer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/coach?stripe=refresh`,
      return_url: `${origin}/dashboard/coach?stripe=done`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe.";
    console.error("[stripe connect onboard] failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
