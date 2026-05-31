'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const ADMIN_EMAIL = 'dylan.2005.redon@gmail.com';

type Candidature = {
  id: string;
  created_at: string;
  statut: string;
  message: string | null;
  mission_id: string;
  travailleur_id: string;
  mission: { titre: string; ville: string; tarif: number; duree_mois: number | null; commission_totale: number | null; employeur_id: string } | null;
  travailleur: { nom: string; email_contact: string | null } | null;
  employeur: { nom: string; email_contact: string | null } | null;
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#F59E0B',
  acceptee: '#10B981',
  refusee: '#EF4444',
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: '⏳ En attente',
  acceptee: '✅ Acceptée',
  refusee: '❌ Refusée',
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [sending, setSending] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [contratModal, setContratModal] = useState<Candidature | null>(null);
  const [contratTexte, setContratTexte] = useState('');

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    if (!authLoading && user) load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('candidatures')
      .select('id, created_at, statut, message, mission_id, travailleur_id')
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Enrichir avec mission, travailleur, employeur
    const enriched: Candidature[] = await Promise.all(data.map(async (c) => {
      const [{ data: mission }, { data: travailleur }] = await Promise.all([
        supabase.from('missions').select('titre, ville, tarif, duree_mois, commission_totale, employeur_id').eq('id', c.mission_id).single(),
        supabase.from('profiles').select('nom, email_contact').eq('id', c.travailleur_id).single(),
      ]);

      const employeur = mission?.employeur_id
        ? (await supabase.from('profiles').select('nom, email_contact').eq('id', mission.employeur_id).single()).data
        : null;

      return { ...c, mission: mission ?? null, travailleur: travailleur ?? null, employeur: employeur ?? null };
    }));

    setCandidatures(enriched);
    setLoading(false);
  }

  async function changerStatut(id: string, statut: string) {
    await supabase.from('candidatures').update({ statut }).eq('id', id);
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
    showToast('success', `Statut mis à jour : ${STATUT_LABELS[statut]}`);
  }

  function ouvrirContrat(c: Candidature) {
    const prenom = c.travailleur?.nom?.split(' ')[0] || 'le travailleur';
    const prenomPro = c.employeur?.nom?.split(' ')[0] || 'le professionnel';
    setContratTexte(
      `Bonjour ${prenom} et ${prenomPro},\n\n` +
      `Suite à l'acceptation de la candidature pour la mission "${c.mission?.titre || ''}" à ${c.mission?.ville || ''}, ` +
      `veuillez trouver ci-joint le contrat de mission Jobici.\n\n` +
      `[Insérez le lien ou les détails du contrat ici]\n\n` +
      `Pour toute question, contactez-nous à contact@job-ici.com.\n\nCordialement,\nL'équipe Jobici`
    );
    setContratModal(c);
  }

  async function envoyerContrat() {
    if (!contratModal || !user) return;
    setSending(contratModal.id);

    const now = new Date().toISOString();
    const msgs = [];

    if (contratModal.travailleur_id) {
      msgs.push({ sender_id: user.id, receiver_id: contratModal.travailleur_id, contenu: contratTexte, created_at: now, lu: false });
    }
    if (contratModal.mission?.employeur_id) {
      msgs.push({ sender_id: user.id, receiver_id: contratModal.mission.employeur_id, contenu: contratTexte, created_at: now, lu: false });
    }

    const { error } = await supabase.from('messages').insert(msgs);

    setSending(null);
    setContratModal(null);

    if (error) {
      showToast('error', 'Erreur lors de l\'envoi : ' + error.message);
    } else {
      showToast('success', '✅ Contrat envoyé aux deux parties !');
      await changerStatut(contratModal.id, 'acceptee');
    }
  }

  const filtered = candidatures.filter(c => filtre === 'tous' || c.statut === filtre);

  if (authLoading) return null;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span style={{ fontSize: 60 }}>🔒</span>
          <h2 style={{ color: 'var(--navy)', fontWeight: 900 }}>Accès réservé</h2>
          <Link href="/" style={{ color: 'var(--teal)', fontWeight: 700 }}>← Retour à l'accueil</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'error' ? '#B91C1C' : '#065F46',
          color: 'white', padding: '14px 24px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          maxWidth: 'min(480px, 90vw)', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      <section className="page-hero">
        <div className="container">
          <h1>Admin Jobici 🛠️</h1>
          <p>Gestion des candidatures et envoi des contrats.</p>
        </div>
      </section>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: 'Toutes' },
            { id: 'en_attente', label: '⏳ En attente' },
            { id: 'acceptee', label: '✅ Acceptées' },
            { id: 'refusee', label: '❌ Refusées' },
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
            {filtered.length} candidature{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span className="big-emoji">📭</span><h3>Aucune candidature</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(c => (
              <div key={c.id} style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${STATUT_COLORS[c.statut] || '#CBD5E1'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                      {c.mission?.titre || 'Mission inconnue'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      📍 {c.mission?.ville || '—'} ·
                      Postulé le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span style={{
                    background: `${STATUT_COLORS[c.statut]}20`,
                    color: STATUT_COLORS[c.statut],
                    padding: '4px 12px', borderRadius: 999,
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {STATUT_LABELS[c.statut] || c.statut}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Travailleur</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{c.travailleur?.nom || '—'}</p>
                    {c.travailleur?.email_contact && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.travailleur.email_contact}</p>}
                  </div>
                  <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Professionnel</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{c.employeur?.nom || '—'}</p>
                    {c.employeur?.email_contact && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.employeur.email_contact}</p>}
                  </div>
                </div>

                {c.mission?.commission_totale && (
                  <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-dark)' }}>
                      💰 Commission Jobici : <strong>{c.mission.commission_totale}€ HT</strong>
                      {c.mission.duree_mois && ` sur ${c.mission.duree_mois} mois`}
                      {c.mission.tarif && ` · ${c.mission.tarif}€/mois`}
                    </p>
                  </div>
                )}

                {c.message && (
                  <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text-dark)', fontStyle: 'italic' }}>
                    💬 "{c.message}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.statut === 'en_attente' && (
                    <>
                      <button onClick={() => changerStatut(c.id, 'acceptee')}
                        style={{ ...btnStyle, background: '#10B981', color: 'white' }}>
                        ✅ Accepter
                      </button>
                      <button onClick={() => changerStatut(c.id, 'refusee')}
                        style={{ ...btnStyle, background: '#EF4444', color: 'white' }}>
                        ❌ Refuser
                      </button>
                    </>
                  )}
                  {c.statut !== 'refusee' && (
                    <button
                      onClick={() => ouvrirContrat(c)}
                      disabled={sending === c.id}
                      style={{ ...btnStyle, background: 'var(--navy)', color: 'white' }}
                    >
                      📄 Envoyer le contrat
                    </button>
                  )}
                  {c.statut !== 'en_attente' && (
                    <button onClick={() => changerStatut(c.id, 'en_attente')}
                      style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
                      Remettre en attente
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal contrat */}
      {contratModal && (
        <>
          <div onClick={() => setContratModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20,
            padding: '32px 28px', zIndex: 9001,
            width: 'min(560px, 92vw)',
            boxShadow: '0 24px 64px rgba(13,31,45,0.2)',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
              📄 Envoyer le contrat
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Ce message sera envoyé à <strong>{contratModal.travailleur?.nom}</strong> et à <strong>{contratModal.employeur?.nom}</strong>.
            </p>
            <textarea
              value={contratTexte}
              onChange={e => setContratTexte(e.target.value)}
              rows={10}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid var(--border)', borderRadius: 10,
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                background: 'var(--cream)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setContratModal(null)}
                style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)' }}>
                Annuler
              </button>
              <button
                onClick={envoyerContrat}
                disabled={!!sending || !contratTexte.trim()}
                style={{ ...btnStyle, background: 'var(--navy)', color: 'white', opacity: sending ? 0.6 : 1 }}
              >
                {sending ? '⏳ Envoi…' : 'Envoyer →'}
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8, border: 'none',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};
