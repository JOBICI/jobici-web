'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MaillageLinks from '@/components/MaillageLinks';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { trouverOuCreerConversationDirecte, envoyerMessageDirect } from '@/lib/conversations';
import { notifyNewMessage } from '@/lib/notifications';

const ADMIN_EMAIL = 'contact@job-ici.com';

const STATUT_LABELS: Record<string, string> = {
  worker: '👷 Travailleur',
  particulier: '🏠 Particulier',
  autoentrepreneur: '🧾 Auto-entrepreneur',
  employer: '💼 Professionnel',
};

type Profile = {
  id: string;
  nom: string;
  prenom: string | null;
  ville: string | null;
  avatar_lettre: string | null;
  photo_url: string | null;
  statut: string;
  bio: string | null;
  note_moyenne: number | null;
  nb_missions: number | null;
  nb_avis: number | null;
  xp_total: number | null;
  niveau: number | null;
  metier: string | null;
  nom_commercial: string | null;
  competences: string[] | null;
  tarif_horaire: number | null;
  disponible: boolean | null;
  siret: string | null;
  email_contact: string | null;
  telephone: string | null;
  experiences: string | null;
  cv_url: string | null;
  lettre_motivation_url: string | null;
  realisations: string[] | null;
};

type Avis = { id: string; note: number; commentaire: string | null; created_at: string; auteurNom: string };

type HistoriqueMission = {
  id: string;
  titre: string;
  ville: string | null;
  tarif: number | null;
  date: string;
  autrePartieNom: string;
  autrePartieEmail: string | null;
};

export default function PublicProfile({ id }: { id: string }) {
  const { user, userProfile } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [historique, setHistorique] = useState<HistoriqueMission[]>([]);

  const [avisGoogle, setAvisGoogle] = useState<{ note: number | null; nb_avis: number | null }>({ note: null, nb_avis: null });
  const [editingGoogle, setEditingGoogle] = useState(false);
  const [noteGoogleTemp, setNoteGoogleTemp] = useState('');
  const [nbAvisGoogleTemp, setNbAvisGoogleTemp] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);

  const [contactModal, setContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isAuto = profile?.statut === 'autoentrepreneur';
  const isWorker = profile?.statut === 'worker';
  const canContact = !!user && !!profile && user.id !== profile.id;
  // Un particulier ne peut jamais engager un travailleur salarié (réservé aux
  // auto-entrepreneurs, CESU en attente DGE) : pas de "proposer une mission"
  // dans ce cas, juste un message classique.
  const isMissionContext = isAuto
    ? (userProfile?.statut === 'employer' || userProfile?.statut === 'particulier')
    : isWorker && userProfile?.statut === 'employer';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, nom, prenom, ville, avatar_lettre, photo_url, statut, bio, note_moyenne, nb_missions, nb_avis, xp_total, niveau, metier, nom_commercial, competences, tarif_horaire, disponible, siret, email_contact, telephone, experiences, cv_url, lettre_motivation_url, realisations')
        .eq('id', id)
        .single();

      if (!data) { setProfile(null); setLoading(false); return; }
      setProfile(data as Profile);

      if (data.statut === 'autoentrepreneur') {
        const [{ data: pack }, { data: google }] = await Promise.all([
          supabase
            .from('user_purchases')
            .select('id')
            .eq('user_id', id)
            .eq('offer_id', 'pack_visibilite_auto')
            .eq('status', 'active')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('avis_google')
            .select('note, nb_avis')
            .eq('profile_id', id)
            .maybeSingle(),
        ]);
        setFeatured(!!pack);
        setAvisGoogle({ note: google?.note ?? null, nb_avis: google?.nb_avis ?? null });
        setNoteGoogleTemp(google?.note != null ? String(google.note) : '');
        setNbAvisGoogleTemp(google?.nb_avis != null ? String(google.nb_avis) : '');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function sauvegarderAvisGoogle() {
    setSavingGoogle(true);
    const note = noteGoogleTemp.trim() ? Number(noteGoogleTemp.replace(',', '.')) : null;
    const nb_avis = nbAvisGoogleTemp.trim() ? Number(nbAvisGoogleTemp) : null;
    const { error } = await supabase
      .from('avis_google')
      .upsert({ profile_id: id, note, nb_avis, updated_at: new Date().toISOString() });
    setSavingGoogle(false);
    if (error) { alert('❌ Erreur : ' + error.message); return; }
    setAvisGoogle({ note, nb_avis });
    setEditingGoogle(false);
  }

  // Avis reçus — pour workers et auto-entrepreneurs
  useEffect(() => {
    async function loadAvis() {
      if (!profile || !(profile.statut === 'worker' || profile.statut === 'autoentrepreneur')) { setAvis([]); return; }
      const { data } = await supabase
        .from('avis')
        .select('id, note, commentaire, created_at, auteur_id')
        .eq('cible_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!data) { setAvis([]); return; }
      const rows = await Promise.all(data.map(async (a) => {
        const { data: auteur } = await supabase.from('profiles').select('nom').eq('id', a.auteur_id).maybeSingle();
        return { id: a.id, note: a.note, commentaire: a.commentaire, created_at: a.created_at, auteurNom: auteur?.nom ?? 'Anonyme' };
      }));
      setAvis(rows);
    }
    loadAvis();
  }, [profile]);

  // Historique des missions effectuées — réservé à l'admin (tarif + email du client)
  useEffect(() => {
    async function loadHistorique() {
      if (!isAdmin || !profile) { setHistorique([]); return; }
      const { data } = await supabase
        .from('candidatures')
        .select('id, mission_id, travailleur_id, employeur_id, missions(titre, ville, tarif, created_at)')
        .or(`travailleur_id.eq.${profile.id},employeur_id.eq.${profile.id}`)
        .eq('statut', 'terminee');
      if (!data) { setHistorique([]); return; }
      const rows = await Promise.all(data.map(async (c) => {
        const autrePartieId = c.travailleur_id === profile.id ? c.employeur_id : c.travailleur_id;
        const { data: autre } = await supabase.from('profiles').select('nom, email_contact').eq('id', autrePartieId).maybeSingle();
        const mission = Array.isArray(c.missions) ? c.missions[0] : c.missions;
        return {
          id: c.id,
          titre: mission?.titre ?? 'Mission',
          ville: mission?.ville ?? null,
          tarif: mission?.tarif ?? null,
          date: mission?.created_at ?? '',
          autrePartieNom: autre?.nom ?? '—',
          autrePartieEmail: autre?.email_contact ?? null,
        };
      }));
      setHistorique(rows);
    }
    loadHistorique();
  }, [isAdmin, profile]);

  async function handleSendMessage() {
    if (!user || !message.trim() || !profile) return;
    setSending(true);
    const { conversationId, error } = await trouverOuCreerConversationDirecte(user.id, profile.id);
    if (error || !conversationId) {
      setSending(false);
      alert('❌ Impossible d\'envoyer le message : ' + (error || 'erreur inconnue'));
      return;
    }
    const { error: msgError } = await envoyerMessageDirect(conversationId, user.id, message.trim());
    setSending(false);
    if (msgError) { alert('❌ ' + msgError.message); return; }
    notifyNewMessage(profile.id, userProfile?.nom || 'Quelqu\'un', message.trim()).catch(() => {});
    setSent(true);
    setMessage('');
  }

  if (loading) return (
    <>
      <Header />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
      </div>
      <Footer />
    </>
  );

  if (!profile) return (
    <>
      <Header />
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <span className="big-emoji">🔍</span>
        <h3>Profil introuvable</h3>
        <p>Ce profil n'existe pas ou n'est plus disponible.</p>
        <Link href="/classement" style={{ color: 'var(--teal)', fontWeight: 700, marginTop: 16, display: 'inline-block' }}>← Retour au classement</Link>
      </div>
      <Footer />
    </>
  );

  const fullName = [profile.prenom, profile.nom].filter(Boolean).join(' ') || profile.nom;
  const displayName = (isAuto && profile.nom_commercial?.trim()) ? profile.nom_commercial.trim() : fullName;
  const initial = displayName.charAt(0).toUpperCase();
  const niveau = profile.niveau ?? 1;
  const niveauLabel = niveau >= 5 ? '💎 Diamant' : niveau >= 4 ? '🥇 Or' : niveau >= 3 ? '🥈 Argent' : '🥉 Bronze';
  const prenomAffiche = profile.prenom || profile.nom.split(' ')[0];

  return (
    <>
      <Header />

      <main style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px 80px' }}>

        <Link href={isAuto ? '/auto-entrepreneurs' : '/classement'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-mid)', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
          ← Retour {isAuto ? 'aux auto-entrepreneurs' : 'au classement'}
        </Link>

        {/* ─── HERO ─── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
          borderRadius: 24, padding: '32px 28px', color: 'white',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          {isAuto && featured && (
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--teal)', color: 'var(--navy)', padding: '6px 18px', borderRadius: '0 24px 0 12px', fontSize: 12, fontWeight: 800 }}>
              ⭐ Profil mis en avant
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={fullName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: featured ? 'var(--teal)' : 'rgba(255,255,255,0.15)',
                color: featured ? 'var(--navy)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, fontWeight: 900, flexShrink: 0,
                border: '3px solid rgba(255,255,255,0.2)',
              }}>
                {profile.avatar_lettre || initial}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>{displayName}</h1>
              {displayName !== fullName && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>{fullName}</p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 6 }}>📍 {profile.ville || 'Localisation non renseignée'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--teal-light)', color: 'var(--teal)', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                  {STATUT_LABELS[profile.statut] || profile.statut}
                </span>
                {profile.metier && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{profile.metier}</span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{niveauLabel}</span>
                {isAuto && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                    {profile.disponible !== false ? '✅ Disponible' : '⏸️ Indisponible'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {profile.note_moyenne !== null && (
              <Stat emoji="⭐" label="Note" value={`${profile.note_moyenne.toFixed(1)} / 5`} />
            )}
            {profile.nb_missions !== null && profile.nb_missions > 0 && (
              <Stat emoji="✅" label="Missions" value={`${profile.nb_missions} réalisée${profile.nb_missions > 1 ? 's' : ''}`} />
            )}
            {profile.xp_total !== null && (
              <Stat emoji="⚡" label="XP" value={`${profile.xp_total} points`} />
            )}
            {isAuto && profile.tarif_horaire != null && (
              <Stat emoji="💶" label="Tarif" value={`${profile.tarif_horaire}€/h`} />
            )}
          </div>
        </div>

        {/* ─── AVIS GOOGLE (auto-entrepreneur, édition réservée admin) ─── */}
        {isAuto && (avisGoogle.note !== null || isAdmin) && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingGoogle ? 14 : 0 }}>
              <div>
                <h2 style={{ ...h2Style, marginBottom: 4 }}>🔍 Avis Google</h2>
                {!editingGoogle && (
                  avisGoogle.note !== null ? (
                    <p style={{ fontSize: 14, color: 'var(--text-dark)' }}>
                      {'⭐'.repeat(Math.round(avisGoogle.note))} <strong>{avisGoogle.note.toFixed(1)}</strong> / 5
                      {avisGoogle.nb_avis != null && <span style={{ color: 'var(--text-muted)' }}> ({avisGoogle.nb_avis} avis)</span>}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune note renseignée.</p>
                  )
                )}
              </div>
              {isAdmin && !editingGoogle && (
                <button onClick={() => setEditingGoogle(true)} style={btnSecondaryStyle}>Modifier</button>
              )}
            </div>
            {isAdmin && editingGoogle && (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Note (0 à 5)</label>
                    <input type="number" min={0} max={5} step={0.1} value={noteGoogleTemp} onChange={e => setNoteGoogleTemp(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nombre d'avis</label>
                    <input type="number" min={0} step={1} value={nbAvisGoogleTemp} onChange={e => setNbAvisGoogleTemp(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEditingGoogle(false)} style={btnSecondaryStyle} disabled={savingGoogle}>Annuler</button>
                  <button onClick={sauvegarderAvisGoogle} style={btnPrimaryStyle} disabled={savingGoogle}>{savingGoogle ? '...' : 'Enregistrer'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── BIO ─── */}
        {profile.bio && (
          <div style={cardStyle}>
            <h2 style={h2Style}>📝 Présentation</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dark)', lineHeight: 1.8 }}>{profile.bio}</p>
          </div>
        )}

        {/* ─── COMPÉTENCES (auto-entrepreneur) ─── */}
        {isAuto && profile.competences && profile.competences.length > 0 && (
          <div style={cardStyle}>
            <h2 style={h2Style}>🛠️ Compétences</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.competences.map(tag => (
                <span key={tag} style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ─── RÉALISATIONS (auto-entrepreneur) ─── */}
        {isAuto && profile.realisations && profile.realisations.length > 0 && (
          <div style={cardStyle}>
            <h2 style={h2Style}>📸 Réalisations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
              {profile.realisations.map(url => (
                <img key={url} src={url} alt="Réalisation" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
              ))}
            </div>
          </div>
        )}

        {/* ─── SIRET masqué (auto-entrepreneur) ─── */}
        {isAuto && (
          <div style={cardStyle}>
            <h2 style={h2Style}>🧾 Informations légales</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 600 }}>Numéro SIRET</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>
                {profile.siret ? `${profile.siret.slice(0, 9)}•••••` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* ─── EXPÉRIENCES (worker) ─── */}
        {isWorker && profile.experiences && (
          <div style={cardStyle}>
            <h2 style={h2Style}>💼 Expériences & compétences</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dark)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{profile.experiences}</p>
          </div>
        )}

        {/* ─── CLASSEMENT XP (worker) ─── */}
        {isWorker && profile.xp_total !== null && (
          <div style={{ background: 'linear-gradient(135deg, var(--teal-light), var(--cream))', borderRadius: 16, padding: 20, border: '1px solid var(--teal-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>🏆</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Classement Jobici</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-mid)' }}>
                <span>⚡ <strong style={{ color: 'var(--teal-dark)' }}>{profile.xp_total}</strong> XP</span>
                <span>🎖️ <strong style={{ color: 'var(--teal-dark)' }}>{niveauLabel}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ─── AVIS (worker / auto-entrepreneur) ─── */}
        {(isWorker || isAuto) && avis.length > 0 && (
          <div style={cardStyle}>
            <h2 style={h2Style}>⭐ Avis ({avis.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {avis.map(a => (
                <div key={a.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{a.auteurNom}</span>
                    <span style={{ fontSize: 13 }}>{'⭐'.repeat(a.note)}</span>
                  </div>
                  {a.commentaire && <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{a.commentaire}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── HISTORIQUE (admin uniquement) ─── */}
        {isAdmin && historique.length > 0 && (
          <div style={cardStyle}>
            <h2 style={h2Style}>🗂️ Historique (admin)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historique.map(h => (
                <div key={h.id} style={{ background: 'var(--cream)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                    {h.titre}{h.ville ? ` · ${h.ville}` : ''}{h.date ? ` · ${new Date(h.date).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
                    💰 {h.tarif != null ? `${h.tarif}€` : '—'} · {h.autrePartieNom}{h.autrePartieEmail ? ` (${h.autrePartieEmail})` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── DOCUMENTS (worker connecté) ─── */}
        {user && isWorker && (profile.cv_url || profile.lettre_motivation_url) && (
          <div style={cardStyle}>
            <h2 style={h2Style}>📎 Documents joints</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.cv_url && <DocLink path={profile.cv_url} label="📄 Voir le CV" />}
              {profile.lettre_motivation_url && <DocLink path={profile.lettre_motivation_url} label="✉️ Voir la lettre de motivation" />}
            </div>
          </div>
        )}

        {/* ─── CONTACT ─── */}
        {canContact && (
          <div style={{ ...cardStyle, border: (isAuto && featured) ? '2px solid var(--teal)' : '1px solid var(--border)' }}>
            <h2 style={h2Style}>📞 Contacter {prenomAffiche}</h2>

            {isAuto && featured && (profile.email_contact || profile.telephone) ? (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20, lineHeight: 1.6 }}>
                  Ce profil a activé le contact direct — vous pouvez le/la joindre immédiatement.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.email_contact && (
                    <a href={`mailto:${profile.email_contact}`} style={{ ...btnPrimaryStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                      ✉️ Envoyer un email
                    </a>
                  )}
                  {profile.telephone && (
                    <a href={`tel:${profile.telephone}`} style={{ ...btnSecondaryStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                      📱 Appeler directement
                    </a>
                  )}
                  <button onClick={() => { setContactModal(true); setSent(false); }} style={{ ...btnSecondaryStyle, border: '1.5px solid var(--teal)', color: 'var(--teal-dark)' }}>
                    💬 Envoyer un message via Jobici
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 16 }}>
                  {isMissionContext
                    ? `Envoyez une proposition de mission à ${prenomAffiche}.`
                    : `Envoyez un message à ${prenomAffiche} via la messagerie Jobici.`}
                </p>
                <button onClick={() => { setContactModal(true); setSent(false); }} style={{ ...btnPrimaryStyle, width: '100%' }}>
                  {isMissionContext ? '📋 Proposer une mission →' : '💬 Envoyer un message'}
                </button>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 16 }}>Connectez-vous pour contacter {prenomAffiche}.</p>
            <Link href="/connexion" style={{ background: 'var(--teal)', color: 'var(--navy)', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
              Se connecter →
            </Link>
          </div>
        )}
      </main>

      {/* ─── MODAL ENVOI DE MESSAGE ─── */}
      {contactModal && (
        <>
          <div onClick={() => setContactModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: 20, padding: '32px 28px', zIndex: 9001, width: 'min(480px, 92vw)', boxShadow: '0 24px 64px rgba(13,31,45,0.2)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <span style={{ fontSize: 56, display: 'block', marginBottom: 14 }}>✅</span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 8 }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>{prenomAffiche} recevra votre message et pourra vous répondre via la messagerie Jobici.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Link href="/messages" style={{ ...btnPrimaryStyle, textDecoration: 'none' }}>Voir mes messages</Link>
                  <button onClick={() => setContactModal(false)} style={btnSecondaryStyle}>Fermer</button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
                  {isMissionContext ? 'Proposition de mission' : `Message à ${prenomAffiche}`}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 18 }}>
                  {isMissionContext ? 'Décrivez la mission : type de travail, lieu, date, rémunération…' : 'Décrivez votre besoin : type de travail, lieu, disponibilités…'}
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Bonjour ${prenomAffiche}, je recherche quelqu'un pour…`}
                  rows={5}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => setContactModal(false)} style={btnSecondaryStyle}>Annuler</button>
                  <button onClick={handleSendMessage} disabled={sending || !message.trim()} style={{ ...btnPrimaryStyle, opacity: (!message.trim() || sending) ? 0.5 : 1 }}>
                    {sending ? '⏳ Envoi…' : 'Envoyer →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <MaillageLinks title="Continuer sur Jobici" />
      <Footer />
    </>
  );
}

function Stat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, marginBottom: 2 }}>{emoji}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{value}</p>
    </div>
  );
}

function DocLink({ path, label }: { path: string; label: string }) {
  async function open() {
    const { data } = await supabase.storage.from('Document').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }
  return (
    <button onClick={open} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, color: 'var(--navy)', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
      {label}
    </button>
  );
}

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 };
const h2Style: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 };
const btnPrimaryStyle: React.CSSProperties = { background: 'var(--teal)', color: 'var(--navy)', padding: '13px 20px', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondaryStyle: React.CSSProperties = { background: 'transparent', color: 'var(--navy)', padding: '13px 20px', borderRadius: 10, border: '1.5px solid var(--border)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
