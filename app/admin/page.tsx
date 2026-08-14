'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import CreerProForm from '@/components/CreerProForm';
import ValiderDocumentsPanel from '@/components/ValiderDocumentsPanel';
import UtilisateursPanel from '@/components/UtilisateursPanel';

const ADMIN_EMAIL = 'contact@job-ici.com';

type Candidature = {
  id: string;
  created_at: string;
  statut: string;
  message: string | null;
  mission_id: string;
  travailleur_id: string;
  mission: { titre: string; ville: string; tarif: number; duree_mois: number | null; commission_totale: number | null; avec_contrat: boolean | null; employeur_id: string } | null;
  travailleur: { id: string; nom: string; email_contact: string | null; est_verifie: boolean | null } | null;
  employeur: { id: string; nom: string; email_contact: string | null } | null;
  conversation_id: string | null;
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
  const [contratFile, setContratFile] = useState<File | null>(null);
  const [vue, setVue] = useState<'candidatures' | 'creer-pro' | 'documents' | 'utilisateurs'>('candidatures');

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
        supabase.from('missions').select('titre, ville, tarif, duree_mois, commission_totale, avec_contrat, employeur_id').eq('id', c.mission_id).single(),
        supabase.from('profiles').select('id, nom, email_contact, est_verifie').eq('id', c.travailleur_id).single(),
      ]);

      const employeur = mission?.employeur_id
        ? (await supabase.from('profiles').select('id, nom, email_contact').eq('id', mission.employeur_id).single()).data
        : null;

      // Conversation liée (même mission + mêmes travailleur/employeur)
      let conversationId: string | null = null;
      if (mission?.employeur_id) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('mission_id', c.mission_id)
          .eq('travailleur_id', c.travailleur_id)
          .eq('employeur_id', mission.employeur_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        conversationId = conv?.id ?? null;
      }

      return { ...c, mission: mission ?? null, travailleur: travailleur ?? null, employeur: employeur ?? null, conversation_id: conversationId };
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
      `Merci de le télécharger, le signer et le renvoyer dans cette conversation (l'employeur d'abord, puis le travailleur).\n\n` +
      `Pour toute question, contactez-nous à contact@job-ici.com.\n\nCordialement,\nL'équipe Jobici`
    );
    setContratModal(c);
  }

  async function envoyerContrat() {
    if (!contratModal || !user) return;
    if (!contratFile) { showToast('error', 'Sélectionnez le fichier du contrat (PDF).'); return; }

    const missionId = contratModal.mission_id;
    const travailleurId = contratModal.travailleur_id;
    const employeurId = contratModal.mission?.employeur_id;
    if (!employeurId || !travailleurId) { showToast('error', 'Parties manquantes (employeur / travailleur).'); return; }

    setSending(contratModal.id);

    // 1. Trouver (ou créer) la conversation pro ↔ travailleur
    let convId: string | null = null;
    const { data: conv } = await supabase.from('conversations')
      .select('id')
      .eq('mission_id', missionId)
      .eq('travailleur_id', travailleurId)
      .eq('employeur_id', employeurId)
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    convId = conv?.id ?? null;
    if (!convId) {
      const { data: newConv, error: convErr } = await supabase.from('conversations')
        .insert({ mission_id: missionId, travailleur_id: travailleurId, employeur_id: employeurId, montant: contratModal.mission?.tarif ?? 0 })
        .select('id').single();
      if (convErr || !newConv) { setSending(null); showToast('error', 'Conversation introuvable : ' + (convErr?.message ?? '')); return; }
      convId = newConv.id;
    }

    // 2. Upload du PDF dans le bucket Document
    const safe = contratFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `contrats/${convId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('Document').upload(path, contratFile, {
      contentType: contratFile.type || 'application/octet-stream', upsert: true,
    });
    if (upErr) { setSending(null); showToast('error', 'Upload impossible : ' + upErr.message); return; }

    // 3. Message d'intro (optionnel) + message "document" dans la conversation
    const msgs: Record<string, unknown>[] = [];
    if (contratTexte.trim()) {
      msgs.push({ conversation_id: convId, auteur_id: user.id, texte: contratTexte.trim(), type: 'normal' });
    }
    msgs.push({ conversation_id: convId, auteur_id: user.id, texte: JSON.stringify({ path, name: contratFile.name }), type: 'document' });
    const { error } = await supabase.from('messages').insert(msgs);

    setSending(null);
    setContratModal(null);
    setContratFile(null);

    if (error) {
      showToast('error', "Erreur lors de l'envoi : " + error.message);
    } else {
      showToast('success', '✅ Contrat envoyé dans la conversation !');
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
          <p>Gestion des candidatures, comptes professionnels et contrats.</p>
        </div>
      </section>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Onglets de vue */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'candidatures' as const, label: '📋 Candidatures' },
            { id: 'documents' as const, label: '🪪 Documents à valider' },
            { id: 'utilisateurs' as const, label: '👥 Utilisateurs' },
            { id: 'creer-pro' as const, label: '🏢 Créer un Professionnel' },
          ].map(v => (
            <button key={v.id} onClick={() => setVue(v.id)}
              style={{
                padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                color: vue === v.id ? 'var(--teal-dark)' : 'var(--text-mid)',
                borderBottom: vue === v.id ? '3px solid var(--teal)' : '3px solid transparent',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {vue === 'creer-pro' ? (
          <CreerProForm onResult={showToast} />
        ) : vue === 'documents' ? (
          <ValiderDocumentsPanel onResult={showToast} />
        ) : vue === 'utilisateurs' ? (
          <UtilisateursPanel onResult={showToast} />
        ) : (
        <>
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
                    {c.travailleur ? (
                      <Link href={`/profil/${c.travailleur.id}`} target="_blank" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline' }}>
                        {c.travailleur.nom || '—'}
                      </Link>
                    ) : <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>—</p>}
                    {c.travailleur?.email_contact && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.travailleur.email_contact}</p>}
                    <p style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: c.travailleur?.est_verifie ? '#10B981' : '#F59E0B' }}>
                      {c.travailleur?.est_verifie ? '✅ Identité vérifiée' : '⚠️ Documents non vérifiés'}
                    </p>
                  </div>
                  <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Professionnel</p>
                    {c.employeur ? (
                      <Link href={`/profil/${c.employeur.id}`} target="_blank" style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline' }}>
                        {c.employeur.nom || '—'}
                      </Link>
                    ) : <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>—</p>}
                    {c.employeur?.email_contact && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.employeur.email_contact}</p>}
                  </div>
                </div>

                {c.mission?.commission_totale != null && (
                  <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-dark)' }}>
                      💰 Commission Jobici : <strong>{c.mission.commission_totale}€ HT</strong>
                      {c.mission.duree_mois && ` sur ${c.mission.duree_mois} mois`}
                      {c.mission.tarif && ` · ${c.mission.tarif}€/mois`}
                      {' · '}{c.mission.avec_contrat ? '📝 Avec contrat Jobici' : c.mission.duree_mois ? '💼 Sans contrat' : '🏠 Mandat CESU'}
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
                      <button
                        onClick={() => {
                          if (!c.travailleur?.est_verifie) {
                            showToast('error', "Impossible d'accepter : la carte d'identité de ce travailleur n'a pas encore été validée (onglet Documents à valider).");
                            return;
                          }
                          changerStatut(c.id, 'acceptee');
                        }}
                        style={{ ...btnStyle, background: '#10B981', color: 'white', opacity: c.travailleur?.est_verifie ? 1 : 0.5 }}>
                        {c.travailleur?.est_verifie ? '✅ Accepter' : '🔒 Accepter (documents non vérifiés)'}
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
                  {c.statut === 'acceptee' && (
                    <>
                      <Link href={`/missions/${c.mission_id}`} target="_blank"
                        style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', textDecoration: 'none', display: 'inline-block' }}>
                        🎯 Voir la mission
                      </Link>
                      {c.conversation_id ? (
                        <Link href={`/messages?conv=${c.conversation_id}`} target="_blank"
                          style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)', textDecoration: 'none', display: 'inline-block' }}>
                          💬 Voir la conversation
                        </Link>
                      ) : (
                        <span style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          💬 Conversation introuvable
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </>
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
              Le contrat (PDF) sera déposé dans la conversation entre <strong>{contratModal.travailleur?.nom}</strong> et <strong>{contratModal.employeur?.nom}</strong>. Ils pourront le télécharger, le signer et le renvoyer.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              Fichier du contrat (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={e => setContratFile(e.target.files?.[0] ?? null)}
              style={{ display: 'block', marginBottom: 14, fontFamily: 'inherit', fontSize: 13 }}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              Message d&apos;accompagnement (optionnel)
            </label>
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
              <button onClick={() => { setContratModal(null); setContratFile(null); }}
                style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)' }}>
                Annuler
              </button>
              <button
                onClick={envoyerContrat}
                disabled={!!sending || !contratFile}
                style={{ ...btnStyle, background: 'var(--navy)', color: 'white', opacity: (sending || !contratFile) ? 0.6 : 1 }}
              >
                {sending ? '⏳ Envoi…' : 'Envoyer le contrat →'}
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
