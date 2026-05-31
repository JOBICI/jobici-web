import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const body = await req.json();
  const { missionData, isParticulier, coutTotal, userEmail } = body;

  if (!missionData?.employeur_id) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  }

  // Créer la mission (service role bypasse RLS)
  const { data: newMission, error: dbError } = await supabaseAdmin
    .from('missions')
    .insert({
      ...missionData,
      statut: isParticulier ? 'en_attente_paiement' : 'active',
      ...(isParticulier && {
        statut_paiement: 'en_attente',
        montant_paye: coutTotal,
      }),
    })
    .select('id')
    .single();

  if (dbError || !newMission) {
    return NextResponse.json({ error: dbError?.message || 'Erreur création mission' }, { status: 500 });
  }

  // Si particulier → créer la session Stripe
  if (isParticulier) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' });
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host')}`;

    const session = await stripe.checkout.sessions.create({
      metadata: {
        offerId: 'mission_publication',
        missionId: newMission.id,
        userId: missionData.employeur_id,
      },
      success_url: `${SITE_URL}/profil?mission=payee`,
      cancel_url: `${SITE_URL}/publier-mission`,
      locale: 'fr',
      ...(userEmail && { customer_email: userEmail }),
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Mission : ${missionData.titre || 'Publication de mission'}`,
            description: 'Tarif travailleur + commission Jobici (15%) + options',
          },
          unit_amount: Math.round(coutTotal * 100),
        },
        quantity: 1,
      }],
    });

    return NextResponse.json({ url: session.url, missionId: newMission.id });
  }

  return NextResponse.json({ missionId: newMission.id });
}
