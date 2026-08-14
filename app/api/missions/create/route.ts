import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const body = await req.json();
  const { missionData } = body;

  if (!missionData?.employeur_id) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  }

  // Créer la mission (service role bypasse RLS). Publication gratuite pour tous —
  // la commission Jobici est calculée et facturée après acceptation d'un candidat.
  const { data: newMission, error: dbError } = await supabaseAdmin
    .from('missions')
    .insert({ ...missionData, statut: 'active' })
    .select('id')
    .single();

  if (dbError || !newMission) {
    return NextResponse.json({ error: dbError?.message || 'Erreur création mission' }, { status: 500 });
  }

  return NextResponse.json({ missionId: newMission.id });
}
