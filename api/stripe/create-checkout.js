'use strict';

const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

  if (!priceId || !userId || !userEmail) {
    return res.status(400).json({ error: 'priceId, userId, and userEmail are required' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe is not configured' });

  const stripe = Stripe(stripeKey);

  try {
    // Look up or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode:                 'subscription',
      success_url:          successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=1`,
      cancel_url:           cancelUrl  || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: userId },
      },
      metadata: { supabase_user_id: userId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[stripe/create-checkout]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
