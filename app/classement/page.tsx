'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type ClassementUser = {
  id: string;
  nom: string | null;
  prenom: string | null;
  avatar_lettre: string | null;
  ville: string | null;
  xp_total: number;
  xp_mensuel: number;
  niveau: number;
  statut: string;
  created_at: string;
};

type CategoryTab = 'travailleurs' | 'auto-entrepreneurs' | 'particuliers';
type TimeTab = 'global' | 'hebdo' | 'local' | 'nouveaux';

const CATEGORY_TABS: { id: CategoryTab; label: string; emoji: string; statuts: string[] }[] = [
  { id: 'travailleurs',       label: 'Travailleurs',       emoji: '👷', statuts: ['worker'] },
  { id: 'auto-entrepreneurs', label: 'Auto-entrepreneurs', emoji: '🧾', statuts: ['autoentrepreneur'] },
  { id: 'particuliers',       label: 'Particuliers',       emoji: '🏠', statuts: ['particulier'] },
];

const TIME_TABS: { id: TimeTab; label: string; emoji: string }[] = [
  { id: 'global',   label: 'Global',   emoji: '🌍' },
  { id: 'hebdo',    label: 'Hebdo',    emoji: '⚡' },
  { id: 'local',    label: 'Local',    emoji: '📍' },
  { id: 'nouveaux', label: 'Nouveaux', emoji: '🌱' },
];

export default function ClassementPage() {
  const { user, userProfile } = useAuth();

  const [category, setCategory] = useState<CategoryTab>('travailleurs');
  const [timeTab, setTimeTab]   = useState<TimeTab>('global');
  const [users, setUsers]       = useState<ClassementUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal "Proposer une mission"
  const [missionModal, setMissionModal] = useState<ClassementUser | null>(null);
  const [missionMsg, setMissionMsg]     = useState('');
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);

  const currentCat = CATEGORY_TABS.find(c => c.id === category)!;
  const canPropose = user && (userProfile?.statut === 'employer' || userProfile?.statut === 'particulier');

  useEffect(() => {
    loadClassement();
  }, [category, timeTab, userProfile]);

  async function loadClassement() {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('id, nom, prenom, avatar_lettre, ville, xp_total, xp_mensuel, niveau, statut, created_at')
      .in('statut', currentCat.statuts);

    if (timeTab === 'global') {
      query = query.order('xp_total', { ascending: false }).limit(50);
    } else if (timeTab === 'hebdo') {
      query = query.order('xp_mensuel', { ascending: false }).limit(50);
    } else if (timeTab === 'local' && userProfile?.ville) {
      query = query.ilike('ville', userProfile.ville).order('xp_total', { ascending: false }).limit(50);
    } else if (timeTab === 'nouveaux') {
      const il30 = new Date();
      il30.setDate(il30.getDate() - 30);
      query = query.gte('created_at', il30.toISOString()).order('xp_mensuel', { ascending: false }).limit(50);
    } else {
      query = query.order('xp_total', { ascending: false }).limit(50);
    }

    const { data } = await query;
    setUsers((data ?? []) as ClassementUser[]);

    if (timeTab === 'global') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('statut', currentCat.statuts);
      setTotalUsers(count ?? 0);
    }

    setLoading(false);
  }

  const myIndex    = user ? users.findIndex(u => u.id === user.id) : -1;
  const myPosition = myIndex !== -1 ? myIndex + 1 : null;
  const getXP      = (u: ClassementUser) => (timeTab === 'hebdo' || timeTab === 'nouveaux') ? u.xp_mensuel : u.xp_total;

  function getProfileLink(u: ClassementUser) {
    if (u.statut === 'autoentrepreneur') return `/auto-entrepreneurs/${u.id}`;
    return `/profil/${u.id}`;
  }

  function displayName(u: ClassementUser) {
    if (u.prenom && u.nom) return `${u.prenom} ${u.nom.charAt(0).toUpperCase()}.`;
    if (u.nom) {
      const parts = u.nom.split(' ');
      if (parts.length >= 2) return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
      return u.nom;
    }
    return 'Anonyme';
  }

  async function sendMission() {
    if (!missionModal || !user || !missionMsg.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: missionModal.id,
      contenu: missionMsg.trim(),
      created_at: new Date().toISOString(),
      lu: false,
    });
    setSending(false);
    setSent(true);
    setMissionMsg('');
  }

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>🏆 Classement <span className="teal-text">Jobici</span></h1>
          <p>Découvrez les meilleurs travailleurs, auto-entrepreneurs et particuliers de la plateforme.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ═══ ONGLETS CATÉGORIES ═══ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {CATEGORY_TABS.map(c => (
            <button key={c.id} onClick={() => { setCategory(c.id); setTimeTab('global'); }}
              style={{
                flex: 1, minWidth: 120, padding: '12px 16px',
                background: category === c.id ? 'var(--navy)' : 'white',
                color: category === c.id ? 'white' : 'var(--text-dark)',
                border: `1.5px solid ${category === c.id ? 'var(--navy)' : 'var(--border)'}`,
                borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: 800, fontSize: 14, transition: 'all 0.15s',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* ═══ MA POSITION (si connecté et dans la bonne catégorie) ═══ */}
        {user && userProfile && currentCat.statuts.includes(userProfile.statut || '') && (
          <div style={{
            background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
            borderRadius: 20, padding: 24, color: 'white', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--teal)', color: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, flexShrink: 0,
              }}>
                {(userProfile.prenom || userProfile.nom || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  Ma position
                </p>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>
                  {myPosition ? `#${myPosition}${timeTab === 'global' && totalUsers > 0 ? ` / ${totalUsers}` : ''}` : 'Pas encore classé'}
                </h2>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>⭐ <strong style={{ color: 'var(--teal)' }}>{userProfile.xp_total ?? 0}</strong> XP</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>🎖️ Niveau <strong style={{ color: 'var(--teal)' }}>{userProfile.niveau ?? 1}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ONGLETS TEMPS ═══ */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 6,
          border: '1px solid var(--border)', display: 'flex', gap: 4,
          marginBottom: 20, overflow: 'auto',
        }}>
          {TIME_TABS.map(t => (
            <button key={t.id} onClick={() => setTimeTab(t.id)}
              style={{
                flex: 1, minWidth: 80, padding: '10px 12px',
                background: timeTab === t.id ? 'var(--navy)' : 'transparent',
                color: timeTab === t.id ? 'white' : 'var(--text-mid)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {timeTab === 'local' && !userProfile?.ville && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: 14, borderRadius: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#92400E' }}>
              ⚠️ Ajoutez votre ville dans votre profil pour voir le classement local.
            </p>
          </div>
        )}

        {/* ═══ LISTE ═══ */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 50, display: 'block', marginBottom: 16 }}>🏆</span>
            <p style={{ color: 'var(--text-mid)', fontSize: 14 }}>Aucun classement disponible pour le moment.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {users.map((u, index) => {
              const position = index + 1;
              const isMe = user?.id === u.id;
              const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;

              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  background: isMe ? 'var(--teal-light)' : 'transparent',
                  borderBottom: index === users.length - 1 ? 'none' : '1px solid var(--border)',
                  borderLeft: isMe ? '4px solid var(--teal)' : '4px solid transparent',
                }}>
                  {/* Position */}
                  <div style={{ width: 36, fontSize: medal ? 22 : 14, fontWeight: 800, color: 'var(--text-mid)', textAlign: 'center', flexShrink: 0 }}>
                    {medal || `#${position}`}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: isMe ? 'var(--teal)' : 'var(--navy)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 900,
                  }}>
                    {u.avatar_lettre || (u.prenom || u.nom || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Nom + Ville */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {user ? (
                      <Link href={getProfileLink(u)} style={{ textDecoration: 'none' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName(u)} {isMe && <span style={{ color: 'var(--teal-dark)', fontSize: 11 }}>(vous)</span>}
                        </p>
                      </Link>
                    ) : (
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayName(u)}
                      </p>
                    )}
                    {u.ville && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {u.ville}</p>}
                  </div>

                  {/* XP + bouton */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: isMe ? 'var(--teal-dark)' : 'var(--navy)' }}>
                        {getXP(u).toLocaleString()} XP
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Niv. {u.niveau || 1}</p>
                    </div>
                    {canPropose && !isMe && (
                      <button
                        onClick={() => { setMissionModal(u); setSent(false); setMissionMsg(''); }}
                        style={{
                          background: 'var(--teal)', color: 'var(--navy)',
                          border: 'none', borderRadius: 8, padding: '7px 12px',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📋 Proposer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!user && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/connexion" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
              Connectez-vous pour voir votre position et proposer des missions →
            </Link>
          </div>
        )}

        {/* Info XP */}
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 16, padding: 20, marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>💡 Comment gagner des XP ?</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>
            <li style={{ padding: '5px 0' }}>✅ Terminer une mission courte : <strong style={{ color: 'var(--teal-dark)' }}>+30 XP</strong></li>
            <li style={{ padding: '5px 0' }}>✅ Terminer une mission standard : <strong style={{ color: 'var(--teal-dark)' }}>+75 XP</strong></li>
            <li style={{ padding: '5px 0' }}>⭐ Recevoir 5 étoiles : <strong style={{ color: 'var(--teal-dark)' }}>+50 XP</strong></li>
            <li style={{ padding: '5px 0' }}>⚡ Répondre en moins de 30 min : <strong style={{ color: 'var(--teal-dark)' }}>+20 XP</strong></li>
            <li style={{ padding: '5px 0' }}>🏆 Débloquer un badge or : <strong style={{ color: 'var(--teal-dark)' }}>+400 XP</strong></li>
          </ul>
        </div>

      </main>

      {/* ═══ MODAL PROPOSER UNE MISSION ═══ */}
      {missionModal && (
        <>
          <div onClick={() => setMissionModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20, padding: '32px 28px',
            zIndex: 9001, width: 'min(480px, 92vw)',
            boxShadow: '0 24px 64px rgba(13,31,45,0.2)',
          }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <span style={{ fontSize: 56, display: 'block', marginBottom: 14 }}>✅</span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 8 }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 24 }}>
                  {displayName(missionModal)} recevra votre proposition de mission.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Link href="/messages" style={{ background: 'var(--teal)', color: 'var(--navy)', padding: '12px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                    Voir mes messages
                  </Link>
                  <button onClick={() => setMissionModal(null)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
                  📋 Proposer une mission à {displayName(missionModal)}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 18 }}>
                  Décrivez la mission : type de travail, lieu, date, rémunération…
                </p>
                <textarea
                  value={missionMsg}
                  onChange={e => setMissionMsg(e.target.value)}
                  placeholder={`Bonjour, je recherche quelqu'un pour…`}
                  rows={5}
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                    background: 'var(--cream)', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                  <button onClick={() => setMissionModal(null)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Annuler
                  </button>
                  <button
                    onClick={sendMission}
                    disabled={sending || !missionMsg.trim()}
                    style={{ background: 'var(--teal)', color: 'var(--navy)', border: 'none', padding: '11px 20px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: (!missionMsg.trim() || sending) ? 0.5 : 1 }}>
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
