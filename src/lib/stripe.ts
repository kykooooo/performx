import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY n'est pas configuré.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
      timeout: 30000,
      maxNetworkRetries: 3,
      appInfo: {
        name: "PerformX",
        version: "0.1.0",
      },
    });
  }
  return stripeInstance;
}

export const isStripeConfigured = Boolean(stripeSecretKey);
