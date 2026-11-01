// lib/conversations.ts — Contact direct entre deux utilisateurs, sans mission
// préalable (conversations.mission_id nullable). Même schéma que app/messages/page.tsx
// et que le mobile (app/profil-auto.tsx, envoyerProposition()).
import { supabase } from './supabase';

export async function trouverOuCreerConversationDirecte(
  meId: string,
  autreId: string
): Promise<{ conversationId: string | null; error: string | null }> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(employeur_id.eq.${meId},travailleur_id.eq.${autreId}),and(employeur_id.eq.${autreId},travailleur_id.eq.${meId})`)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return { conversationId: existing.id, error: null };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ employeur_id: meId, travailleur_id: autreId, mission_id: null })
    .select('id')
    .single();

  return { conversationId: data?.id ?? null, error: error?.message ?? null };
}

export async function envoyerMessageDirect(conversationId: string, auteurId: string, texte: string) {
  return supabase
    .from('messages')
    .insert({ conversation_id: conversationId, auteur_id: auteurId, texte, type: 'normal' });
}
