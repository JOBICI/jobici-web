'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type Profile = {
  id: string;
  nom: string;
  prenom: string | null;
  ville: string | null;
  avatar_lettre: string | null;
  statut: string;
  bio: string | null;
  note_moyenne: number | null;
  nb_missions: number | null;
  xp_total: number | null;
  niveau: number | null;
  metier: string | null;
  experiences: string | null;
  cv_url: string | null;
  lettre_motivation_url: string | null;
};

const STATUT_LABELS: Record<string, string> = {
  worker: '👷 Travailleur',
  particulier: '🏠 Particulier',
  autoentrepreneur: '🧾 Auto-entrepreneur',
  employer: '💼 Professionnelle',
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [missionModal, setMissionModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canPropose = user && user.id !== id && (userProfile?.statut === 'employer' || userProfile?.statut === 'particulier');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, nom, prenom, ville, avatar_lettre, statut, bio, note_moyenne, nb_missions, xp_total, niveau, metier, experiences, cv_url, lettre_motivation_url')
        .eq('id', id)
        .single();
      setProfile(data as Profile ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function sendMission() {
    if (!user || !message.trim() || !profile) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: profile.id,
      contenu: message.trim(),
      created_at: new Date().toISOString(),
      lu: false,
    });
    setSending(false);
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
        <Link href="/classement" style={{ color: 'var(--teal)', fontWeight: 700, marginTop: 16, display: 'inline-block' }}>← Retour au classement</Link>
      </div>
      <Footer />
    </>
  );

  const fullName = [profile.prenom, profile.nom].filter(Boolean).join(' ') || profile.nom;
  const initial = fullName.charAt(0).toUpperCase();
  const niveau = profile.niveau ?? 1;
  const niveauLabel = niveau >= 5 ? '💎 Diamant' : niveau >= 4 ? '🥇 Or' : niveau >= 3 ? '🥈 Argent' : '🥉 Bronze';

  return (
    <>
      <Header />

      <main style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px 80px' }}>

        <Link href="/classement" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-mid)', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
          ← Retour au classement
        </Link>

        {/* Hero card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
          borderRadius: 24, padding: '32px 28px', color: 'white', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--teal)', color: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 900, flexShrink: 0,
            }}>
              {profile.avatar_lettre || initial}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{fullName}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 }}>
                📍 {profile.ville || 'Localisation non renseignée'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--teal-light)', color: 'var(--teal)', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                  {STATUT_LABELS[profile.statut] || profile.statut}
                </span>
                {profile.metier && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                    {profile.metier}
                  </span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                  {niveauLabel}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {profile.note_moyenne !== null && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Note</p>
                <p style={{ fontSize: 14, fontWeight: 800 }}>⭐ {profile.note_moyenne.toFixed(1)} / 5</p>
              </div>
            )}
            {profile.nb_missions !== null && profile.nb_missions > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Missions</p>
                <p style={{ fontSize: 14, fontWeight: 800 }}>✅ {profile.nb_missions}</p>
              </div>
            )}
            {profile.xp_total !== null && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>XP</p>
                <p style={{ fontSize: 14, fontWeight: 800 }}>⚡ {profile.xp_total}</p>
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>📝 Présentation</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dark)', lineHeight: 1.8 }}>{profile.bio}</p>
          </div>
        )}

        {/* Expériences (travailleurs) */}
        {profile.statut === 'worker' && profile.experiences && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>💼 Expériences & compétences</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dark)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{profile.experiences}</p>
          </div>
        )}

        {/* Classement XP (travailleurs) */}
        {profile.statut === 'worker' && profile.xp_total !== null && (
          <div style={{ background: 'linear-gradient(135deg, var(--teal-light), var(--cream))', borderRadius: 16, padding: 20, border: '1px solid var(--teal-border)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>🏆</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Classement Jobici</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-mid)' }}>
                <span>⚡ <strong style={{ color: 'var(--teal-dark)' }}>{profile.xp_total}</strong> XP</span>
                <span>🎖️ <strong style={{ color: 'var(--teal-dark)' }}>{niveauLabel}</strong></span>
                {profile.nb_missions !== null && profile.nb_missions > 0 && (
                  <span>✅ <strong style={{ color: 'var(--teal-dark)' }}>{profile.nb_missions}</strong> mission{profile.nb_missions > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CV et lettre de motivation — visibles uniquement pour les pros/particuliers connectés */}
        {user && profile.statut === 'worker' && (profile.cv_url || profile.lettre_motivation_url) && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>📎 Documents joints</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.cv_url && (
                <DocLink bucket="Document" path={profile.cv_url} label="📄 Voir le CV" />
              )}
              {profile.lettre_motivation_url && (
                <DocLink bucket="Document" path={profile.lettre_motivation_url} label="✉️ Voir la lettre de motivation" />
              )}
            </div>
          </div>
        )}

        {canPropose && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '2px solid var(--teal)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
              📋 Proposer une mission
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 16 }}>
              Envoyez une proposition de mission à {profile.prenom || profile.nom.split(' ')[0]}.
            </p>
            <button
              onClick={() => { setMissionModal(true); setSent(false); }}
              style={{ background: 'var(--teal)', color: 'var(--navy)', border: 'none', borderRadius: 10, padding: '13px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
            >
              📋 Proposer une mission →
            </button>
          </div>
        )}

        {!user && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 16 }}>Connectez-vous pour proposer une mission.</p>
            <Link href="/connexion" style={{ background: 'var(--teal)', color: 'var(--navy)', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
              Se connecter →
            </Link>
          </div>
        )}
      </main>

      {/* Modal mission */}
      {missionModal && (
        <>
          <div onClick={() => setMissionModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20, padding: '32px 28px',
            zIndex: 9001, width: 'min(480px, 92vw)',
            boxShadow: '0 24px 64px rgba(13,31,45,0.2)',
          }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <span style={{ fontSize: 56, display: 'block', marginBottom: 14 }}>✅</span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 8 }}>Proposition envoyée !</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
                  {profile.prenom || profile.nom.split(' ')[0]} recevra votre message.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Link href="/messages" style={{ background: 'var(--teal)', color: 'var(--navy)', padding: '12px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                    Voir mes messages
                  </Link>
                  <button onClick={() => setMissionModal(false)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
                  Proposition de mission
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 18 }}>
                  Décrivez la mission : type de travail, lieu, date, rémunération…
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Bonjour ${profile.prenom || profile.nom.split(' ')[0]}, je recherche quelqu'un pour…`}
                  rows={5}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                  <button onClick={() => setMissionModal(false)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Annuler
                  </button>
                  <button onClick={sendMission} disabled={sending || !message.trim()}
                    style={{ background: 'var(--teal)', color: 'var(--navy)', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: (!message.trim() || sending) ? 0.5 : 1 }}>
                    {sending ? '⏳ Envoi…' : 'Envoyer →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <Footer />
    </>
  );
}

function DocLink({ bucket, path, label }: { bucket: string; path: string; label: string }) {
  async function open() {
    const { data } = await (await import('@/lib/supabase')).supabase
      .storage.from(bucket).createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }
  return (
    <button onClick={open} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: 'var(--cream)',
      border: '1px solid var(--border)', borderRadius: 10,
      fontSize: 14, fontWeight: 700, color: 'var(--navy)',
      cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
    }}>
      {label}
    </button>
  );
}
