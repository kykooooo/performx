# Stripe — Setup PerformX

Intégration Stripe Checkout pour les paiements de séances.

## 1. Variables d'environnement

À ajouter dans `.env.local` (dev) et sur Vercel (prod) :

```bash
# Stripe - clés depuis https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...               # clé secrète (jamais exposée au client)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # clé publique (optionnelle pour Checkout hosted)
STRIPE_WEBHOOK_SECRET=whsec_...              # signature du webhook

# Supabase service role (requis pour que le webhook puisse écrire en DB)
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # récupérer dans Supabase > Settings > API
```

**Important** : `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` sont **secrètes** — ne jamais préfixer par `NEXT_PUBLIC_`.

## 2. Migration DB

Appliquer la migration `supabase/migrations/007_stripe.sql` sur Supabase (via le dashboard SQL editor ou MCP `apply_migration`).

Ce que fait la migration :
- Ajoute `bookings.stripe_session_id` + `bookings.stripe_payment_intent_id`
- Change le `payment_status` default de `'paid'` à `'pending'`
- Crée une RPC `create_paid_booking(...)` appelée par le webhook (service role uniquement)
- Crée une RPC `get_booking_by_stripe_session(...)` appelée par la page de confirmation (user authentifié)

## 3. Configuration Stripe Dashboard

1. **Activer les paiements** : https://dashboard.stripe.com/settings/payment_methods
   - Cocher "Carte" au minimum.
2. **Créer un webhook endpoint** : https://dashboard.stripe.com/webhooks
   - URL : `https://performx-six.vercel.app/api/stripe/webhook` (ou ton domaine custom)
   - Événements à écouter : `checkout.session.completed`
   - Récupérer le "Signing secret" → coller dans `STRIPE_WEBHOOK_SECRET`

En local pour tester :
```bash
# Installer Stripe CLI : https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copier le whsec_... affiché dans STRIPE_WEBHOOK_SECRET
```

## 4. Flow de paiement

```
[Client]                    [Next.js API]               [Stripe]          [Webhook]
  |                              |                         |                   |
  | POST /api/stripe/checkout    |                         |                   |
  |----------------------------->|                         |                   |
  |                              | create Session          |                   |
  |                              |------------------------>|                   |
  |                              |<- session.url ----------|                   |
  |<--- { url } -----------------|                         |                   |
  |                              |                         |                   |
  | redirect vers session.url    |                         |                   |
  |-------------------------------------------------------->|                   |
  |                              |                                             |
  | [l'utilisateur paie]                                                       |
  |                              |                                             |
  |<---- redirect success_url -------------------------------                   |
  | /booking/confirmation?session_id=cs_xxx                                    |
  |                              |       checkout.session.completed            |
  |                              |<------------------------------------------- |
  |                              |     POST /api/stripe/webhook                |
  |                              |     -> create_paid_booking (RPC)            |
  |                              |                                             |
  | RPC get_booking_by_stripe_session polling                                  |
  |----------------------------->|                                             |
  |<--- booking details ---------|                                             |
  |                              |                                             |
  | affiche "Réservation confirmée"                                            |
```

## 5. Test end-to-end

1. Aller sur `/booking?coach=<id>`
2. Sélectionner un créneau
3. Cliquer "Payer et confirmer"
4. Utiliser une carte test Stripe : `4242 4242 4242 4242` · n'importe quelle date future · CVC `123`
5. Après paiement, redirect vers `/booking/confirmation?session_id=cs_xxx`
6. Le polling Supabase attend le webhook (1-3 secondes) puis affiche la confirmation.

## 6. Dépannage

- **"Stripe non configuré"** → `STRIPE_SECRET_KEY` manquant.
- **"Webhook non configuré"** → `STRIPE_WEBHOOK_SECRET` manquant.
- **"Impossible d'écrire en DB"** → `SUPABASE_SERVICE_ROLE_KEY` manquant ou migration 007 non appliquée.
- **Le booking ne s'affiche pas dans `/booking/confirmation`** → vérifier les logs du webhook dans Stripe Dashboard > Developers > Webhooks.
- **"Coach introuvable"** → le coach n'existe pas dans la table `coaches` ou pas de ligne correspondante.
