'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  created_at: string;
};

type TabType = 'global' | 'hebdo' | 'local' | 'nouveaux';

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'global',   label: 'Global',    emoji: '🌍' },
  { id: 'hebdo',    label: 'Hebdo',     emoji: '⚡' },
  { id: 'local',    label: 'Local',     emoji: '📍' },
  { id: 'nouveaux', label: 'Nouveaux',  emoji: '🌱' },
];

export default function ClassementPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<TabType>('global');
  const [users, setUsers] = useState<ClassementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadClassement();
  }, [tab, user, userProfile]);

  async function loadClassement() {
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('id, nom, prenom, avatar_lettre, ville, xp_total, xp_mensuel, niveau, created_at')
      .in('statut', ['worker', 'autoentrepreneur']);

    if (tab === 'global') {
      query = query.order('xp_total', { ascending: false }).limit(50);
    } else if (tab === 'hebdo') {
      query = query.order('xp_mensuel', { ascending: false }).limit(50);
    } else if (tab === 'local' && userProfile?.ville) {
      query = query
        .ilike('ville', userProfile.ville)
        .order('xp_total', { ascending: false })
        .limit(50);
    } else if (tab === 'nouveaux') {
      // Inscrits dans les 30 derniers jours, classés par xp_mensuel
      const il30 = new Date();
      il30.setDate(il30.getDate() - 30);
      query = query
        .gte('created_at', il30.toISOString())
        .order('xp_mensuel', { ascending: false })
        .limit(50);
    }

    const { data, error } = await query;

    if (!error && data) {
      setUsers(data as ClassementUser[]);
    }

    // Compter le total d'utilisateurs (pour ma position globale)
    if (tab === 'global') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('statut', ['worker', 'autoentrepreneur']);
      if (count) setTotalUsers(count);
    }

    setLoading(false);
  }

  // ── Loader ──
  if (authLoading) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  // ── Ma position dans le classement actuel ──
  const myIndex = users.findIndex(u => u.id === user.id);
  const myPosition = myIndex !== -1 ? myIndex + 1 : null;
  const myXP = userProfile?.xp_total || 0;
  const myXPMensuel = userProfile?.xp_mensuel || 0;
  const myLevel = userProfile?.niveau || 1;

  // ── XP du onglet actuel ──
  const getXP = (u: ClassementUser) => (tab === 'hebdo' || tab === 'nouveaux') ? u.xp_mensuel : u.xp_total;

  return (
    <>
      <Header />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/profil" style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>
            ← Retour au profil
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--navy)', marginTop: 12, letterSpacing: -1 }}>
            🏆 Classement
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: 14, marginTop: 4 }}>
            Découvrez le top des travailleurs Jobici et votre position.
          </p>
        </div>

        {/* ═══ MA CARTE POSITION ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
          borderRadius: 20, padding: 28, color: 'white', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--teal)', color: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 900, flexShrink: 0,
            }}>
              {(userProfile?.prenom || userProfile?.nom || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Ma position
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 900, marginTop: 4, letterSpacing: -0.5 }}>
                {myPosition ? (
                  <>#{myPosition} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: 18 }}>
                    {tab === 'global' && totalUsers > 0 && ` sur ${totalUsers}`}
                  </span></>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 600 }}>
                    Pas encore classé
                  </span>
                )}
              </h2>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  ⭐ <strong style={{ color: 'var(--teal)' }}>{myXP}</strong> XP total
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  ⚡ <strong style={{ color: 'var(--teal)' }}>{myXPMensuel}</strong> XP ce mois
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  🎖️ Niveau <strong style={{ color: 'var(--teal)' }}>{myLevel}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ONGLETS ═══ */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 6,
          border: '1px solid var(--border)', display: 'flex', gap: 4,
          marginBottom: 20, overflow: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, minWidth: 90,
                padding: '10px 14px',
                background: tab === t.id ? 'var(--navy)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-mid)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ MESSAGE CONTEXTUEL ═══ */}
        {tab === 'local' && !userProfile?.ville && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            padding: 16, borderRadius: 12, marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
              ⚠️ Pour voir le classement local, ajoutez votre ville dans votre profil.
            </p>
          </div>
        )}

        {/* ═══ LISTE DU CLASSEMENT ═══ */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>Chargement du classement...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 50, display: 'block', marginBottom: 16 }}>🏆</span>
            <h3 style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Aucun classement disponible
            </h3>
            <p style={{ color: 'var(--text-mid)', fontSize: 14 }}>
              {tab === 'local' && 'Personne dans votre ville pour le moment.'}
              {tab === 'nouveaux' && 'Aucun nouvel inscrit récent.'}
              {(tab === 'global' || tab === 'hebdo') && 'Personne n\'a encore d\'XP. Soyez le premier !'}
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {users.map((u, index) => {
              const position = index + 1;
              const isMe = u.id === user.id;
              const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
              const xpToShow = getXP(u);

              // Anonymiser le nom (Dylan R. au lieu de Dylan Redon)
              const displayName = (() => {
                if (u.prenom && u.nom) {
                  return `${u.prenom} ${u.nom.charAt(0).toUpperCase()}.`;
                }
                if (u.nom) {
                  const parts = u.nom.split(' ');
                  if (parts.length >= 2) return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
                  return u.nom;
                }
                return 'Anonyme';
              })();

              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 20px',
                    background: isMe ? 'var(--teal-light)' : 'transparent',
                    borderBottom: index === users.length - 1 ? 'none' : '1px solid var(--border)',
                    borderLeft: isMe ? '4px solid var(--teal)' : '4px solid transparent',
                  }}
                >
                  {/* Position */}
                  <div style={{
                    width: 40, fontSize: medal ? 24 : 16,
                    fontWeight: 800, color: isMe ? 'var(--teal-dark)' : 'var(--text-mid)',
                    textAlign: 'center',
                  }}>
                    {medal || `#${position}`}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: isMe ? 'var(--teal)' : 'var(--cream)',
                    color: isMe ? 'var(--navy)' : 'var(--text-mid)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, flexShrink: 0,
                    border: isMe ? 'none' : '1px solid var(--border)',
                  }}>
                    {u.avatar_lettre || (u.prenom || u.nom || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Nom + Ville */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: isMe ? 800 : 700,
                      color: 'var(--navy)', marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {displayName} {isMe && <span style={{ color: 'var(--teal-dark)', fontSize: 11, marginLeft: 4 }}>(vous)</span>}
                    </p>
                    {u.ville && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📍 {u.ville}
                      </p>
                    )}
                  </div>

                  {/* XP */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: isMe ? 'var(--teal-dark)' : 'var(--navy)' }}>
                      {xpToShow.toLocaleString()} XP
                    </p>
                    {tab !== 'hebdo' && tab !== 'nouveaux' && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Niveau {u.niveau || 1}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ INFO COMMENT GAGNER DES XP ═══ */}
        <div style={{
          background: 'var(--teal-light)', border: '1px solid var(--teal-border)',
          borderRadius: 16, padding: 20, marginTop: 24,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>
            💡 Comment gagner des XP ?
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>
            <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Terminer une mission courte : <strong style={{ color: 'var(--teal-dark)' }}>+30 XP</strong>
            </li>
            <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ Terminer une mission standard : <strong style={{ color: 'var(--teal-dark)' }}>+75 XP</strong>
            </li>
            <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⭐ Recevoir 5 étoiles : <strong style={{ color: 'var(--teal-dark)' }}>+50 XP</strong>
            </li>
            <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚡ Répondre en moins de 30 min : <strong style={{ color: 'var(--teal-dark)' }}>+20 XP</strong>
            </li>
            <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 Débloquer un badge or : <strong style={{ color: 'var(--teal-dark)' }}>+400 XP</strong>
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}
