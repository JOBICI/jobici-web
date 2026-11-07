'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ProfileFull = {
  id: string;
  nom: string;
  statut: string;
  ville: string | null;
  adresse: string | null;
  email_contact: string | null;
  telephone: string | null;
  est_verifie: boolean | null;
  messagerie_bloquee: boolean | null;
  note_moyenne: number | null;
  nb_avis: number | null;
  created_at: string;
};

type MissionPostee = { id: string; titre: string; ville: string | null; tarif: number; est_devis: boolean | null; statut: string; created_at: string };
type CandidatureRow = { id: string; statut: string; prix_propose: number | null; created_at: string; mission_id: string; missions: { titre: string | null; ville: string | null; tarif: number | null; statut: string | null } | null };
type DocRow = { type: string; statut: string; created_at: string };

const STATUT_LABELS: Record<string, string> = {
  worker: '🎓 Travailleur',
  particulier: '🏠 Particulier',
  autoentrepreneur: '🧾 Auto-entrepreneur',
  employer: '🏢 Professionnel',
};

const MISSION_STATUT_LABELS: Record<string, string> = {
  active: '🟢 Active',
  pourvue: '✅ Pourvue',
  annulee: '❌ Annulée',
};

const CAND_STATUT_LABELS: Record<string, string> = {
  en_attente: '⏳ En attente',
  acceptee: '✅ Acceptée',
  refusee: '❌ Refusée',
  terminee: '🏁 Terminée',
};

const DOC_STATUT_LABELS: Record<string, string> = {
  en_attente: '⏳ En attente',
  valide: '✅ Validé',
  refuse: '❌ Refusé',
};

export default function UtilisateurDetailModal({
  userId,
  onClose,
  onResult,
}: {
  userId: string;
  onClose: () => void;
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [missionsPostees, setMissionsPostees] = useState<MissionPostee[]>([]);
  const [candidatures, setCandidatures] = useState<CandidatureRow[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data: p, error } = await supabase
      .from('profiles')
      .select('id, nom, statut, ville, adresse, email_contact, telephone, est_verifie, messagerie_bloquee, note_moyenne, nb_avis, created_at')
      .eq('id', userId)
      .single();
    if (error || !p) { onResult('error', 'Impossible de charger ce profil : ' + (error?.message ?? '')); setLoading(false); return; }
    setProfile(p as ProfileFull);

    const estClient = p.statut === 'particulier' || p.statut === 'employer';

    const [{ data: missions }, { data: cands }, { data: docs }] = await Promise.all([
      estClient
        ? supabase.from('missions').select('id, titre, ville, tarif, est_devis, statut, created_at').eq('employeur_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as MissionPostee[] }),
      !estClient
        ? supabase.from('candidatures').select('id, statut, prix_propose, created_at, mission_id, missions(titre, ville, tarif, statut)').eq('travailleur_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as CandidatureRow[] }),
      supabase.from('documents_identite').select('type, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    setMissionsPostees((missions as unknown as MissionPostee[]) ?? []);
    setCandidatures((cands as unknown as CandidatureRow[]) ?? []);
    setDocuments((docs as unknown as DocRow[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => { charger(); }, [charger]);

  async function toggleMessagerie() {
    if (!profile) return;
    const nouveauBlocage = !profile.messagerie_bloquee;
    if (!confirm(nouveauBlocage
      ? `Bloquer la messagerie de ${profile.nom} ? Ce compte ne pourra plus envoyer de nouveaux messages.`
      : `Débloquer la messagerie de ${profile.nom} ?`)) return;

    setToggling(true);
    const { error } = await supabase.from('profiles').update({ messagerie_bloquee: nouveauBlocage }).eq('id', userId);
    setToggling(false);
    if (error) { onResult('error', 'Impossible de mettre à jour : ' + error.message); return; }
    setProfile({ ...profile, messagerie_bloquee: nouveauBlocage });
    onResult('success', nouveauBlocage ? `Messagerie de ${profile.nom} bloquée.` : `Messagerie de ${profile.nom} débloquée.`);
  }

  const estClient = profile ? (profile.statut === 'particulier' || profile.statut === 'employer') : true;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {loading || !profile ? (
          <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)' }}>{profile.nom || 'Sans nom'}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {STATUT_LABELS[profile.statut] || profile.statut} · Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <Link href={`/profil/${profile.id}`} target="_blank" style={{ fontSize: 12, color: 'var(--teal-dark)', fontWeight: 700, textDecoration: 'underline' }}>
              Voir le profil public →
            </Link>

            {/* Contact */}
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: 16, marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Contact</p>
              <p style={{ fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>📧 {profile.email_contact || '—'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>📞 {profile.telephone || '—'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy)' }}>📍 {profile.adresse || profile.ville || '—'}</p>
            </div>

            {/* Vérification + messagerie */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 999,
                background: profile.est_verifie ? '#D1FAE5' : '#FEF3C7',
                color: profile.est_verifie ? '#065F46' : '#92400E',
              }}>
                {profile.est_verifie ? '✅ Vérifié — peut postuler' : '⚠️ Non vérifié — bloqué pour postuler'}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 999,
                background: profile.messagerie_bloquee ? '#FEE2E2' : '#D1FAE5',
                color: profile.messagerie_bloquee ? '#991B1B' : '#065F46',
              }}>
                {profile.messagerie_bloquee ? '🔒 Messagerie bloquée' : '💬 Messagerie active'}
              </span>
            </div>

            <button
              onClick={toggleMessagerie}
              disabled={toggling}
              style={{
                marginTop: 10, padding: '10px 18px', borderRadius: 10, border: 'none',
                background: profile.messagerie_bloquee ? '#10B981' : '#EF4444', color: 'white',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: toggling ? 0.5 : 1,
              }}
            >
              {toggling ? '⏳' : profile.messagerie_bloquee ? '🔓 Débloquer la messagerie' : '🔒 Bloquer la messagerie'}
            </button>

            {/* Documents */}
            {documents.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>🪪 Documents</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {documents.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid)', background: 'var(--cream)', borderRadius: 8, padding: '8px 12px' }}>
                      <span>{d.type}</span>
                      <span style={{ fontWeight: 700 }}>{DOC_STATUT_LABELS[d.statut] || d.statut}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missions */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
                {estClient ? '🗂️ Missions publiées' : '🧰 Missions effectuées'}
              </p>
              {estClient ? (
                missionsPostees.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune mission publiée.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {missionsPostees.map(m => (
                      <div key={m.id} style={{ background: 'var(--cream)', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                          <span>{m.titre}</span>
                          <span>{MISSION_STATUT_LABELS[m.statut] || m.statut}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          📍 {m.ville || '—'} · {m.est_devis ? 'Sur devis' : `${m.tarif}€`} · {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : candidatures.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune mission effectuée.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {candidatures.map(c => (
                    <div key={c.id} style={{ background: 'var(--cream)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        <span>{c.missions?.titre || 'Mission'}</span>
                        <span>{CAND_STATUT_LABELS[c.statut] || c.statut}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        📍 {c.missions?.ville || '—'} · {c.prix_propose ?? c.missions?.tarif ?? '—'}€ · {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
