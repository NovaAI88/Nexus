'use strict';

/**
 * Stripe webhook handler.
 * Handles subscription lifecycle events and syncs subscription_tier to Supabase profiles.
 *
 * Events handled:
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   checkout.session.completed
 *
 * To register: set webhook endpoint to https://<your-domain>/api/stripe/webhook
 * Events: customer.subscription.*, checkout.session.completed
 */

const Stripe = require('stripe');

// Map Stripe price IDs to subscription tiers
function priceToTier(priceId) {
  const personalPriceId = process.env.STRIPE_PERSONAL_PRICE_ID;
  const teamPriceId     = process.env.STRIPE_TEAM_PRICE_ID;
  if (priceId === personalPriceId) return 'personal';
  if (priceId === teamPriceId)     return 'team';
  return 'free';
}

async function updateProfile(supabaseUrl, serviceKey, userId, updates) {
  if (!supabaseUrl || !serviceKey || !userId) return;
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey      = process.env.STRIPE_SECRET_KEY;
  const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl    = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceKey     = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = Stripe(stripeKey);

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    // Vercel provides body as Buffer when rawBody is enabled
    const rawBody = req.body;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Dev: parse JSON directly (no signature verification)
      event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    }
  } catch (err) {
    console.error('[stripe/webhook] signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const { type, data: { object } } = event;

  try {
    switch (type) {
      case 'checkout.session.completed': {
        const session = object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Fetch subscription to get price ID
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceToTier(priceId);

        await updateProfile(supabaseUrl, serviceKey, userId, {
          subscription_tier:       tier,
          stripe_customer_id:      session.customer,
          stripe_subscription_id:  session.subscription,
          stripe_price_id:         priceId,
          subscription_status:     subscription.status,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = object;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const tier = sub.status === 'active' || sub.status === 'trialing'
          ? priceToTier(priceId)
          : 'free';

        await updateProfile(supabaseUrl, serviceKey, userId, {
          subscription_tier:    tier,
          stripe_price_id:      priceId,
          subscription_status:  sub.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = object;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await updateProfile(supabaseUrl, serviceKey, userId, {
          subscription_tier:       'free',
          stripe_subscription_id:  null,
          stripe_price_id:         null,
          subscription_status:     'cancelled',
        });
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${type}:`, err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
};
