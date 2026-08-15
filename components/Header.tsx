'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'contact@job-ici.com';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nbNonLu, setNbNonLu] = useState(0);
  const { user, userProfile, logout } = useAuth();

  const initial = (userProfile?.nom || user?.email || '?').charAt(0).toUpperCase();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadNonLu = useCallback(async () => {
    if (!user || isAdmin) { setNbNonLu(0); return; }
    const { data } = await supabase
      .from('conversations')
      .select('id, employeur_id, travailleur_id, lu_employeur_at, lu_travailleur_at')
      .or(`travailleur_id.eq.${user.id},employeur_id.eq.${user.id}`);
    if (!data) return;

    const results = await Promise.all(data.map(async (conv) => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('auteur_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const dernierMsg = msgs?.[0];
      if (!dernierMsg || dernierMsg.auteur_id === user.id) return false;
      const monLuAt = user.id === conv.employeur_id ? conv.lu_employeur_at : conv.lu_travailleur_at;
      return !monLuAt || new Date(dernierMsg.created_at) > new Date(monLuAt);
    }));
    setNbNonLu(results.filter(Boolean).length);
  }, [user, isAdmin]);

  useEffect(() => { loadNonLu(); }, [loadNonLu]);

  useEffect(() => {
    if (!user || isAdmin) return;
    const channel = supabase
      .channel('header-conv-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadNonLu())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadNonLu())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user, isAdmin, loadNonLu]);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-text">job<span className="accent">ici</span></span>
        </Link>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Métier, ville, mot-clé…" />
        </div>

        <nav className="nav">
          <Link href="/missions">Missions</Link>
          <Link href="/auto-entrepreneurs">Auto-entrepreneurs</Link>
          <Link href="/offres">Offres & Tarifs</Link>
          <Link href="/pros">Pour les Pros</Link>
          <Link href="/travailleurs">Pour les Travailleurs</Link>
          <Link href="/comment">Comment ça marche</Link>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  background: 'var(--teal)', color: 'var(--navy)',
                  width: 38, height: 38, borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {initial}
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0,
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 8, minWidth: 180,
                  boxShadow: '0 8px 24px rgba(13,31,45,0.12)', zIndex: 200,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                      {userProfile?.nom || 'Mon compte'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>
                  <Link href="/profil" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                    👤 Mon profil
                  </Link>
                  <Link href="/classement" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                    🏆 Classement
                  </Link>
                  <Link href="/messages" style={{ ...dropdownItemStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setProfileOpen(false)}>
                    <span>💬 Messages</span>
                    {nbNonLu > 0 && <span style={badgeStyle}>{nbNonLu}</span>}
                  </Link>
                  <Link href="/publier-mission" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                    📋 Publier une mission
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" style={dropdownItemStyle} onClick={() => setProfileOpen(false)}>
                      🛠️ Administration
                    </Link>
                  )}

                  <button
                    onClick={async () => { await logout(); setProfileOpen(false); }}
                    style={{ ...dropdownItemStyle, color: 'var(--urgent)', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    🚪 Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/connexion" style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: 14 }}>
                Connexion
              </Link>
              <Link href="/inscription" className="nav-cta">
                S'inscrire
              </Link>
            </>
          )}
        </nav>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {menuOpen && (
        <nav style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '16px 20px', gap: 14, borderTop: '1px solid var(--border)' }}>
          <Link href="/missions" onClick={() => setMenuOpen(false)}>Missions</Link>
          <Link href="/auto-entrepreneurs" onClick={() => setMenuOpen(false)}>Auto-entrepreneurs</Link>
          <Link href="/offres" onClick={() => setMenuOpen(false)}>Offres & Tarifs</Link>
          <Link href="/pros" onClick={() => setMenuOpen(false)}>Pour les Pros</Link>
          <Link href="/travailleurs" onClick={() => setMenuOpen(false)}>Pour les Travailleurs</Link>
          <Link href="/comment" onClick={() => setMenuOpen(false)}>Comment ça marche</Link>
          {user ? (
            <>
              <Link href="/profil" onClick={() => setMenuOpen(false)}>👤 Mon profil</Link>
              <Link href="/classement" onClick={() => setMenuOpen(false)}>🏆 Classement</Link>
              <Link href="/messages" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                💬 Messages
                {nbNonLu > 0 && <span style={badgeStyle}>{nbNonLu}</span>}
              </Link>
              <Link href="/publier-mission" onClick={() => setMenuOpen(false)}>📋 Publier une mission</Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>🛠️ Administration</Link>
              )}
              <button
                onClick={async () => { await logout(); setMenuOpen(false); }}
                style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--urgent)', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                🚪 Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/connexion" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link href="/inscription" className="nav-cta" onClick={() => setMenuOpen(false)}>S'inscrire</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'block', padding: '10px 14px', fontSize: 13, fontWeight: 600,
  color: 'var(--text-dark)', borderRadius: 8, textDecoration: 'none',
};

const badgeStyle: React.CSSProperties = {
  background: 'var(--urgent)', color: 'white', borderRadius: 999,
  minWidth: 18, height: 18, fontSize: 10, fontWeight: 800,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
};
