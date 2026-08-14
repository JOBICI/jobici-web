// lib/moderation.ts — Signalement et blocage d'utilisateurs (sécurité messagerie)
import { supabase } from './supabase';

export async function signalerUtilisateur(
  reportedId: string,
  motif: string,
  options?: { conversationId?: string; missionId?: string }
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté.' };
  if (user.id === reportedId) return { error: 'Action impossible.' };

  const { error } = await supabase.from('signalements').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    conversation_id: options?.conversationId ?? null,
    mission_id: options?.missionId ?? null,
    motif: motif.trim().slice(0, 500),
  });
  return { error: error?.message ?? null };
}

export async function bloquerUtilisateur(blockedId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté.' };
  if (user.id === blockedId) return { error: 'Action impossible.' };

  const { error } = await supabase
    .from('utilisateurs_bloques')
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
  return { error: error?.message ?? null };
}

export async function debloquerUtilisateur(blockedId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté.' };

  const { error } = await supabase
    .from('utilisateurs_bloques')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);
  return { error: error?.message ?? null };
}

// Renvoie les IDs bloqués par moi + les IDs des personnes qui m'ont bloqué.
export async function getRelationsBlocage(
  userId: string
): Promise<{ bloquesParMoi: string[]; mOntBloque: string[] }> {
  const { data } = await supabase
    .from('utilisateurs_bloques')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const bloquesParMoi: string[] = [];
  const mOntBloque: string[] = [];
  (data ?? []).forEach((row: any) => {
    if (row.blocker_id === userId) bloquesParMoi.push(row.blocked_id);
    else if (row.blocked_id === userId) mOntBloque.push(row.blocker_id);
  });
  return { bloquesParMoi, mOntBloque };
}

export const MOTIFS_SIGNALEMENT = [
  'Harcèlement ou comportement abusif',
  'Photo ou contenu inapproprié',
  'Arnaque ou demande d\'argent suspecte',
  'Propos discriminatoires',
  'Autre',
];
