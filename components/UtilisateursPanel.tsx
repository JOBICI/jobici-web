'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  nom: string;
  statut: string;
  ville: string | null;
  email_contact: string | null;
  est_verifie: boolean | null;
  created_at: string;
};

const STATUT_LABELS: Record<string, string> = {
  worker: '🎓 Travailleur',
  particulier: '🏠 Particulier',
  autoentrepreneur: '🧾 Auto-entrepreneur',
  employer: '🏢 Professionnel',
};

export default function UtilisateursPanel({
  onResult,
}: {
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'verifies' | 'non_verifies'>('tous');

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nom, statut, ville, email_contact, est_verifie, created_at')
      .order('created_at', { ascending: false });
    if (error) onResult('error', 'Impossible de charger les utilisateurs : ' + error.message);
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const filtered = users.filter(u => {
    if (filtre === 'verifies') return !!u.est_verifie;
    if (filtre === 'non_verifies') return !u.est_verifie;
    return true;
  });

  if (loading) return <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'tous' as const, label: 'Tous' },
          { id: 'verifies' as const, label: '✅ Vérifiés' },
          { id: 'non_verifies' as const, label: '⚠️ Non vérifiés' },
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
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} compte{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><span className="big-emoji">👥</span><h3>Aucun utilisateur</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'white', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <div>
                <Link href={`/profil/${u.id}`} target="_blank" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline' }}>
                  {u.nom || 'Sans nom'}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {STATUT_LABELS[u.statut] || u.statut} {u.ville ? `· ${u.ville}` : ''}
                  {u.email_contact ? ` · ${u.email_contact}` : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
                background: u.est_verifie ? '#D1FAE5' : '#FEF3C7',
                color: u.est_verifie ? '#065F46' : '#92400E',
                whiteSpace: 'nowrap',
              }}>
                {u.est_verifie ? '✅ Vérifié' : '⚠️ Non vérifié'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
