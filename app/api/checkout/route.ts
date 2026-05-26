import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const OFFERS = {
  boost_annonce: {
    name: 'Remonter mon annonce',
    description: 'Annonce en tête 3 jours · Visible en premier · Badge Récent',
    amount: 200,
    mode: 'payment' as const,
  },
  sos_annonce: {
    name: 'SOS Annonce',
    description: 'Notif push immédiate à tous les travailleurs · Épinglée 7 jours · Badge Urgent · Réponse garantie 2h',
    amount: 499,
    mode: 'payment' as const,
  },
  pack_mensuel_particulier: {
    name: 'Pack Mensuel Particulier',
    description: 'SOS Annonce illimité pour toutes tes annonces · Sans engagement',
    amount: 999,
    mode: 'subscription' as const,
  },
  pack_mensuel_pro: {
    name: 'Pack Mensuel Pro',
    description: 'SOS Annonce illimité pour toutes tes annonces · Sans engagement',
    amount: 999,
    mode: 'subscription' as const,
  },
  pack_visibilite_travailleur: {
    name: 'Pack Visibilité Travailleur',
    description: 'Profil vu en premier par les pros · Notif 30 min avant post d\'annonce · Sans engagement',
    amount: 999,
    mode: 'subscription' as const,
  },
  pack_visibilite_auto: {
    name: 'Pack Visibilité Auto-Entrepreneur',
    description: 'Profil mis en avant · Contact direct pros & particuliers · Sans engagement',
    amount: 999,
    mode: 'subscription' as const,
  },
} as const;

export type OfferId = keyof typeof OFFERS;

export async function POST(req: NextRequest) {
  // Stripe est initialisé ici (et non au niveau module) pour éviter
  // un crash silencieux si la clé n'est pas encore configurée.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.startsWith('sk_test_REMPLACER')) {
    return NextResponse.json(
      { error: 'Paiement non configuré. Renseigne STRIPE_SECRET_KEY dans .env.local.' },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' });

  try {
    const body = await req.json() as {
      offerId: OfferId;
      missionId?: string;
      promoCode?: string;
      userId?: string;
      userEmail?: string;
    };
    const { offerId, missionId, promoCode, userId, userEmail } = body;

    const offer = OFFERS[offerId];
    if (!offer) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 400 });
    }

    const metadata: Record<string, string> = {
      offerId,
      ...(missionId && { missionId }),
      ...(userId && { userId }),
    };

    let discounts: Stripe.Checkout.SessionCreateParams['discounts'];
    if (promoCode) {
      const coupons = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (coupons.data.length > 0) {
        discounts = [{ promotion_code: coupons.data[0].id }];
      } else {
        return NextResponse.json({ error: 'Code promo invalide ou expiré' }, { status: 400 });
      }
    }

    const commonParams: Stripe.Checkout.SessionCreateParams = {
      metadata,
      success_url: `${SITE_URL}/offres/succes?offer=${offerId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/offres`,
      locale: 'fr',
      ...(userEmail && { customer_email: userEmail }),
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    };

    const lineItem = {
      price_data: {
        currency: 'eur' as const,
        product_data: { name: offer.name, description: offer.description },
        unit_amount: offer.amount,
        ...(offer.mode === 'subscription' && { recurring: { interval: 'month' as const } }),
      },
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      ...commonParams,
      mode: offer.mode,
      line_items: [lineItem],
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
