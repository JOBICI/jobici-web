import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

// Client admin Supabase (service_role) pour écrire les achats
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Invalid signature', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { offerId, missionId, userId } = session.metadata || {};

    if (userId && offerId) {
      await supabaseAdmin.from('user_purchases').insert({
        user_id: userId,
        offer_id: offerId,
        mission_id: missionId || null,
        stripe_session_id: session.id,
        amount: (session.amount_total ?? 0) / 100,
        status: 'active',
        created_at: new Date().toISOString(),
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabaseAdmin
        .from('user_purchases')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('stripe_session_id', sub.id);
    }
  }

  return NextResponse.json({ received: true });
}
