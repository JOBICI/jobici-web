'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type MissionRow = {
  id: string;
  titre: string;
  ville: string | null;
  tarif: number;
  est_devis: boolean | null;
  statut: string;
  created_at: string;
  employeur_id: string;
  profiles: { nom: string | null } | null;
};

const STATUT_LABELS: Record<string, string> = {
  active: '🟢 Active',
  pourvue: '✅ Pourvue',
  annulee: '❌ Annulée',
};

export default function MissionsPanel({
  onResult,
}: {
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'active' | 'pourvue' | 'annulee'>('tous');
  const [suppId, setSuppId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('missions')
      .select('id, titre, ville, tarif, est_devis, statut, created_at, employeur_id, profiles!employeur_id(nom)')
      .order('created_at', { ascending: false });
    if (error) onResult('error', 'Impossible de charger les missions : ' + error.message);
    setMissions((data as unknown as MissionRow[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function supprimer(m: MissionRow) {
    if (!confirm(`Supprimer définitivement la mission "${m.titre}" ?\n\nCette action est irréversible.`)) return;
    setSuppId(m.id);
    const { error } = await supabase.from('missions').delete().eq('id', m.id);
    setSuppId(null);
    if (error) { onResult('error', 'Suppression impossible : ' + error.message); return; }
    setMissions(prev => prev.filter(x => x.id !== m.id));
    onResult('success', `Mission "${m.titre}" supprimée.`);
  }

  const filtered = missions.filter(m => {
    if (filtre !== 'tous' && m.statut !== filtre) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return m.titre?.toLowerCase().includes(s) || m.ville?.toLowerCase().includes(s) || m.profiles?.nom?.toLowerCase().includes(s);
  });

  if (loading) return <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Titre, ville, employeur…"
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit' }}
        />
        {[
          { id: 'tous' as const, label: 'Toutes' },
          { id: 'active' as const, label: '🟢 Actives' },
          { id: 'pourvue' as const, label: '✅ Pourvues' },
          { id: 'annulee' as const, label: '❌ Annulées' },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            style={{
              padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
              background: filtre === f.id ? 'var(--navy)' : 'var(--cream)',
              color: filtre === f.id ? 'white' : 'var(--text-dark)',
              border: filtre === f.id ? '1px solid transparent' : '1px solid var(--border)',
            }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {filtered.length} mission{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><span className="big-emoji">📋</span><h3>Aucune mission</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'white', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <div>
                <Link href={`/missions/${m.id}`} target="_blank" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline' }}>
                  {m.titre || 'Mission'}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {STATUT_LABELS[m.statut] || m.statut} · 📍 {m.ville || '—'} · {m.est_devis ? '📝 Sur devis' : `${m.tarif}€`}
                  {m.profiles?.nom ? ` · par ${m.profiles.nom}` : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Publiée le {new Date(m.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <button
                onClick={() => supprimer(m)}
                disabled={suppId === m.id}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: suppId === m.id ? 0.5 : 1,
                }}
              >
                {suppId === m.id ? '⏳' : '🗑️ Supprimer'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
