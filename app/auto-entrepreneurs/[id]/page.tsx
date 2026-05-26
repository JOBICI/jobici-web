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
  ville: string;
  avatar_lettre: string;
  siret: string;
  metier: string | null;
  bio: string | null;
  note_moyenne: number | null;
  nb_missions: number | null;
  xp_total: number | null;
  niveau: number | null;
  email_contact: string | null;
  telephone: string | null;
  featured: boolean;
};

export default function AutoEntrepreneurProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [msgEnvoye, setMsgEnvoye] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, nom, ville, avatar_lettre, siret, metier, bio, note_moyenne, nb_missions, xp_total, niveau, email_contact, telephone')
        .eq('id', id)
        .eq('statut', 'autoentrepreneur')
        .single();

      if (!data) { setLoading(false); return; }

      const { data: pack } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', id)
        .eq('offer_id', 'pack_visibilite_auto')
        .eq('status', 'active')
        .limit(1)
        .single();

      setProfile({ ...data, featured: !!pack });
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSendMessage() {
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
    setMsgEnvoye(true);
    setMessage('');
  }

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <span className="big-emoji">🔍</span>
          <h3>Profil introuvable</h3>
          <p>Ce profil n'existe pas ou n'est plus disponible.</p>
          <Link href="/auto-entrepreneurs" style={{ color: 'var(--teal)', fontWeight: 700, marginTop: 16, display: 'inline-block' }}>
            ← Retour à la liste
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const initial = (profile.nom || '?').charAt(0).toUpperCase();
  const niveau = profile.niveau ?? 1;
  const niveauLabel = niveau >= 5 ? '💎 Diamant' : niveau >= 4 ? '🥇 Or' : niveau >= 3 ? '🥈 Argent' : '🥉 Bronze';

  return (
    <>
      <Header />

      <main style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px 80px' }}>

        {/* ─── RETOUR ─── */}
        <Link href="/auto-entrepreneurs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-mid)', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
          ← Retour aux auto-entrepreneurs
        </Link>

        {/* ─── CARTE HERO ─── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
          borderRadius: 24, padding: '32px 28px', color: 'white',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          {profile.featured && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: 'var(--teal)', color: 'var(--navy)',
              padding: '6px 18px', borderRadius: '0 24px 0 12px',
              fontSize: 12, fontWeight: 800,
            }}>
              ⭐ Profil mis en avant
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: profile.featured ? 'var(--teal)' : 'rgba(255,255,255,0.15)',
              color: profile.featured ? 'var(--navy)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 900, flexShrink: 0,
              border: '3px solid rgba(255,255,255,0.2)',
            }}>
              {initial}
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>
                {profile.nom}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 6 }}>
                📍 {profile.ville || 'Localisation non renseignée'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--teal-light)', color: 'var(--teal)',
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                }}>
                  🧾 Auto-entrepreneur
                </span>
                {profile.metier && (
                  <span style={{
                    background: 'rgba(255,255,255,0.1)', color: 'white',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  }}>
                    {profile.metier}
                  </span>
                )}
                <span style={{
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                }}>
                  {niveauLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {profile.note_moyenne !== null && (
              <Stat emoji="⭐" label="Note" value={profile.note_moyenne.toFixed(1) + ' / 5'} />
            )}
            {profile.nb_missions !== null && profile.nb_missions > 0 && (
              <Stat emoji="✅" label="Missions" value={`${profile.nb_missions} réalisée${profile.nb_missions > 1 ? 's' : ''}`} />
            )}
            {profile.xp_total !== null && (
              <Stat emoji="⚡" label="XP" value={`${profile.xp_total} points`} />
            )}
          </div>
        </div>

        {/* ─── BIO ─── */}
        {profile.bio && (
          <div style={cardStyle}>
            <h2 style={h2Style}>📝 Présentation</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dark)', lineHeight: 1.8 }}>{profile.bio}</p>
          </div>
        )}

        {/* ─── SIRET (masqué) ─── */}
        <div style={cardStyle}>
          <h2 style={h2Style}>🧾 Informations légales</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 600 }}>Numéro SIRET</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>
              {profile.siret ? `${profile.siret.slice(0, 9)}•••••` : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 600 }}>Statut</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-dark)' }}>✅ Vérifié</span>
          </div>
        </div>

        {/* ─── CONTACT ─── */}
        <div style={{ ...cardStyle, border: profile.featured ? '2px solid var(--teal)' : '1px solid var(--border)' }}>
          <h2 style={h2Style}>📞 Contacter {profile.nom.split(' ')[0]}</h2>

          {profile.featured ? (
            /* Contact direct pour les profils mis en avant */
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20, lineHeight: 1.6 }}>
                Ce profil a activé le contact direct — vous pouvez le/la joindre immédiatement.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.email_contact && (
                  <a
                    href={`mailto:${profile.email_contact}`}
                    style={{ ...btnPrimaryStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                  >
                    ✉️ Envoyer un email
                  </a>
                )}
                {profile.telephone && (
                  <a
                    href={`tel:${profile.telephone}`}
                    style={{ ...btnSecondaryStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                  >
                    📱 Appeler directement
                  </a>
                )}
                <button
                  onClick={() => setContactModal(true)}
                  style={{ ...btnSecondaryStyle, border: '1.5px solid var(--teal)', color: 'var(--teal-dark)' }}
                >
                  💬 Envoyer un message via Jobici
                </button>
              </div>
            </div>
          ) : (
            /* Message via Jobici pour les profils standards */
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20, lineHeight: 1.6 }}>
                Envoyez un message à {profile.nom.split(' ')[0]} via la messagerie Jobici.
              </p>
              <button
                onClick={() => user ? setContactModal(true) : window.location.href = '/connexion'}
                style={{ ...btnPrimaryStyle, width: '100%' }}
              >
                💬 Envoyer un message
              </button>
              {!user && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                  Vous devez être connecté pour envoyer un message.
                </p>
              )}
            </div>
          )}
        </div>

      </main>

      {/* ─── MODAL ENVOI DE MESSAGE ─── */}
      {contactModal && (
        <>
          <div
            onClick={() => { setContactModal(false); setMsgEnvoye(false); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20,
            padding: '32px 28px', zIndex: 9001,
            width: 'min(480px, 90vw)',
            boxShadow: '0 24px 64px rgba(13,31,45,0.2)',
          }}>
            {msgEnvoye ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: 60, display: 'block', marginBottom: 16 }}>✅</span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 8 }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
                  {profile.nom.split(' ')[0]} recevra votre message et pourra vous répondre via la messagerie Jobici.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Link href="/messages" style={{ ...btnPrimaryStyle, textDecoration: 'none' }}>Voir mes messages</Link>
                  <button onClick={() => { setContactModal(false); setMsgEnvoye(false); }} style={btnSecondaryStyle}>Fermer</button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
                  Message à {profile.nom.split(' ')[0]}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20 }}>
                  Décrivez votre besoin : type de travail, lieu, disponibilités…
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Bonjour ${profile.nom.split(' ')[0]}, je recherche quelqu'un pour…`}
                  rows={5}
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                    background: 'var(--cream)', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => setContactModal(false)} style={btnSecondaryStyle}>Annuler</button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    style={{ ...btnPrimaryStyle, opacity: (!message.trim() || sending) ? 0.5 : 1 }}
                  >
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

function Stat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, marginBottom: 2 }}>{emoji}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{value}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: 24,
  border: '1px solid var(--border)', marginBottom: 16,
};
const h2Style: React.CSSProperties = {
  fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 16,
};
const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--teal)', color: 'var(--navy)',
  padding: '13px 20px', borderRadius: 10, border: 'none',
  fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent', color: 'var(--navy)',
  padding: '13px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
