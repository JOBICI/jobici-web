import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' });
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { missionId, userId } = await req.json() as { missionId: string; userId: string };
  if (!missionId || !userId) {
    return NextResponse.json({ error: 'missionId et userId requis' }, { status: 400 });
  }

  // Vérifier que la mission appartient à l'utilisateur
  const { data: mission } = await supabaseAdmin
    .from('missions')
    .select('id, employeur_id, stripe_payment_id, statut_paiement, titre')
    .eq('id', missionId)
    .single();

  if (!mission || mission.employeur_id !== userId) {
    return NextResponse.json({ error: 'Mission introuvable ou accès refusé' }, { status: 403 });
  }

  // Rembourser si un paiement Stripe existe
  if (mission.stripe_payment_id && mission.statut_paiement === 'paye') {
    try {
      await stripe.refunds.create({ payment_intent: mission.stripe_payment_id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur Stripe';
      return NextResponse.json({ error: `Remboursement échoué : ${msg}` }, { status: 500 });
    }
  }

  // Supprimer la mission
  await supabaseAdmin.from('missions').delete().eq('id', missionId);

  return NextResponse.json({ success: true });
}
