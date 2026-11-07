'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type AvisRow = {
  id: string;
  created_at: string;
  note: number | null;
  commentaire: string | null;
  mission_id: string | null;
  auteur_id: string | null;
  cible_id: string | null;
  auteur: { nom: string | null } | null;
  cible: { nom: string | null } | null;
  mission: { titre: string | null } | null;
};

export default function AvisPanel({
  onResult,
}: {
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [avis, setAvis] = useState<AvisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [suppId, setSuppId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('avis')
      .select('id, created_at, note, commentaire, mission_id, auteur_id, cible_id, auteur:auteur_id(nom), cible:cible_id(nom), mission:mission_id(titre)')
      .order('created_at', { ascending: false });
    if (error) onResult('error', 'Impossible de charger les avis : ' + error.message);
    setAvis((data as unknown as AvisRow[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function supprimer(a: AvisRow) {
    const cibleNom = a.cible?.nom || 'cet utilisateur';
    if (!confirm(`Annuler définitivement cet avis (${a.note ?? '?'}/5) laissé pour ${cibleNom} ?\n\nLa note moyenne de son profil sera recalculée.`)) return;
    setSuppId(a.id);

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setSuppId(null);
      onResult('error', 'Session expirée ou introuvable — reconnecte-toi puis réessaie.');
      return;
    }

    const { data, error } = await supabase.functions.invoke('admin-delete-avis', {
      body: { avisId: a.id },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });
    setSuppId(null);

    let errMsg = (data as { error?: string } | null)?.error;
    if (!errMsg && error) {
      errMsg = error.message;
      const ctx = (error as unknown as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
      if (ctx?.json) {
        try { errMsg = (await ctx.json())?.error ?? errMsg; } catch { /* garde le message générique */ }
      }
    }
    if (errMsg) { onResult('error', errMsg); return; }

    setAvis(prev => prev.filter(x => x.id !== a.id));
    onResult('success', `Avis supprimé, note de ${cibleNom} recalculée.`);
  }

  const filtered = avis.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.cible?.nom?.toLowerCase().includes(s) || a.auteur?.nom?.toLowerCase().includes(s) || a.commentaire?.toLowerCase().includes(s);
  });

  if (loading) return <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom noté, auteur, commentaire…"
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} avis
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><span className="big-emoji">⭐</span><h3>Aucun avis</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              background: 'white', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                  {'⭐'.repeat(a.note ?? 0)}{'☆'.repeat(Math.max(0, 5 - (a.note ?? 0)))}
                  <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 13, color: 'var(--text-mid)' }}>
                    pour {a.cible?.nom || 'Utilisateur'}
                  </span>
                </div>
                {a.commentaire && (
                  <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4, fontStyle: 'italic' }}>"{a.commentaire}"</p>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Par {a.auteur?.nom || 'Anonyme'}
                  {a.mission?.titre && <> · {a.mission.titre}</>}
                  {' · '}
                  {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </div>
                {a.cible_id && (
                  <Link href={`/profil/${a.cible_id}`} target="_blank" style={{ fontSize: 12, color: 'var(--teal-dark)', fontWeight: 700, textDecoration: 'underline' }}>
                    Voir le profil →
                  </Link>
                )}
              </div>
              <button
                onClick={() => supprimer(a)}
                disabled={suppId === a.id}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: suppId === a.id ? 0.5 : 1,
                }}
              >
                {suppId === a.id ? '⏳' : '🗑️ Annuler'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
