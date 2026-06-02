'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MissionCard from '@/components/MissionCard';
import { supabase, type Mission } from '@/lib/supabase';

const FILTERS = [
  { id: 'all',          label: 'Tout' },
  { id: 'urgent',       label: '⚡ Urgent' },
  { id: 'menage',       label: '🧹 Ménage' },
  { id: 'jardinage',    label: '🌿 Jardinage' },
  { id: 'garde',        label: '👶 Garde d\'enfants' },
  { id: 'demenagement', label: '📦 Déménagement' },
  { id: 'bricolage',    label: '🔧 Bricolage' },
  { id: 'livraison',    label: '🛵 Livraison' },
  { id: 'cours',        label: '📚 Cours particuliers' },
  { id: 'vente',        label: '🛍️ Vente' },
];

type AEProfile = { id: string; nom: string; ville: string | null; metier: string | null; avatar_lettre: string | null; note_moyenne: number | null };

export default function Home() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [autoEntrepreneurs, setAutoEntrepreneurs] = useState<AEProfile[]>([]);

  useEffect(() => {
    async function loadMissions() {
      const { data } = await supabase
        .from('missions')
        .select('*')
        .eq('statut', 'active')
        .order('created_at', { ascending: false })
        .limit(12);
      if (data) setMissions(data);
      setLoading(false);
    }

    async function loadAE() {
      const { data: packs } = await supabase
        .from('user_purchases')
        .select('user_id')
        .eq('offer_id', 'pack_visibilite_auto')
        .eq('status', 'active');

      if (!packs || packs.length === 0) return;
      const ids = packs.map((p: { user_id: string }) => p.user_id);

      const { data } = await supabase
        .from('profiles')
        .select('id, nom, ville, metier, avatar_lettre, note_moyenne')
        .eq('statut', 'autoentrepreneur')
        .in('id', ids)
        .limit(6);

      if (data) setAutoEntrepreneurs(data as AEProfile[]);
    }

    loadMissions();
    loadAE();
  }, []);

  const filtered = missions.filter(m => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return m.est_urgent;
    const titre = (m.titre || '').toLowerCase();
    const map: Record<string, string[]> = {
      menage:       ['ménage', 'nettoy'],
      jardinage:    ['jardin', 'tonte', 'pelouse'],
      garde:        ['garde', 'enfant', 'baby'],
      demenagement: ['démén', 'demenagement', 'transport'],
      bricolage:    ['bricolage', 'monta', 'peintur'],
      livraison:    ['livr', 'course'],
      cours:        ['cours', 'soutien', 'révi'],
      vente:        ['vente', 'vendeur', 'boutique'],
    };
    return (map[activeFilter] || []).some(kw => titre.includes(kw));
  });

  return (
    <>
      <Header />

      {/* HERO MINI */}
      <section className="hero-mini">
        <div className="container">
          <h1>Trouve ta mission <span className="teal-text">près de chez toi</span> 🎯</h1>
          <p>Particuliers, pros, étudiants, auto-entrepreneurs — trouve ce qu'il te faut en quelques clics.</p>

          <div className="categories-scroll">
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`cat-pill ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MISSIONS GRID */}
      <main className="missions-section">
        <div className="section-head">
          <h2>Missions disponibles</h2>
          <Link href="/missions" className="see-all">Voir tout →</Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="big-emoji">⏳</span>
            <h3>Chargement...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="big-emoji">🔍</span>
            <h3>Aucune mission disponible pour le moment</h3>
            <p>Revenez plus tard, de nouvelles missions sont publiées régulièrement.</p>
          </div>
        ) : (
          <div className="missions-grid">
            {filtered.map(m => <MissionCard key={m.id} mission={m} />)}
          </div>
        )}

        <div className="cta-box">
          <span className="cta-emoji">🎯</span>
          <div className="cta-text">
            <h3>Vous cherchez une mission spécifique ?</h3>
            <p>Consultez toutes les missions disponibles près de chez vous et postulez en quelques clics.</p>
          </div>
          <Link href="/missions" className="btn-primary">Voir toutes les missions →</Link>
        </div>
      </main>

      {/* AUTO-ENTREPRENEURS */}
      {autoEntrepreneurs.length > 0 && (
        <section className="missions-section" style={{ background: 'var(--cream)' }}>
          <div className="section-head">
            <h2>🧾 Auto-entrepreneurs disponibles</h2>
            <Link href="/auto-entrepreneurs" className="see-all">Voir tous →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {autoEntrepreneurs.map(ae => {
              const initial = (ae.nom || '?').charAt(0).toUpperCase();
              return (
                <Link key={ae.id} href={`/auto-entrepreneurs/${ae.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: 16, padding: 20,
                    border: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'center',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(13,31,45,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--teal)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, flexShrink: 0 }}>
                      {ae.avatar_lettre || initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ae.nom}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: ae.metier ? 4 : 0 }}>📍 {ae.ville || '—'}</p>
                      {ae.metier && <span style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{ae.metier}</span>}
                    </div>
                    {ae.note_moyenne && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>⭐ {ae.note_moyenne.toFixed(1)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Pourquoi choisir Jobici ?</h2>
          <p className="section-subtitle">La plateforme qui simplifie la mise en relation pour des missions de proximité.</p>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-emoji">⚡</span>
              <h3>Rapide</h3>
              <p>Trouve une mission ou un travailleur en quelques minutes, pas en quelques jours.</p>
            </div>
            <div className="feature-card">
              <span className="feature-emoji">🔒</span>
              <h3>Sécurisé</h3>
              <p>Profils vérifiés, paiement sécurisé via Stripe et cotisations URSSAF automatiques (CESU).</p>
            </div>
            <div className="feature-card">
              <span className="feature-emoji">📍</span>
              <h3>Local</h3>
              <p>Toutes les missions sont près de chez toi, en Auvergne-Rhône-Alpes pour commencer.</p>
            </div>
            <div className="feature-card">
              <span className="feature-emoji">💸</span>
              <h3>Transparent</h3>
              <p>0% de commission pour les travailleurs. 15% pour les particuliers, 20% pour les pros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUI SOMMES-NOUS POUR */}
      <section className="double-cta">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 900, color: 'var(--navy)', marginBottom: 8 }}>Pour qui est Jobici ?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-mid)', fontSize: 15, marginBottom: 32 }}>Une plateforme pensée pour tout le monde.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Link href="/inscription?type=particulier" className="cta-card" style={{ textDecoration: 'none' }}>
              <span className="cta-emoji-big">🏠</span>
              <h3>Particulier</h3>
              <p>Publiez une mission et trouvez quelqu'un de confiance près de chez vous.</p>
              <span className="cta-arrow">Je publie une mission →</span>
            </Link>
            <Link href="/inscription?type=worker" className="cta-card worker" style={{ textDecoration: 'none' }}>
              <span className="cta-emoji-big">🎓</span>
              <h3>Étudiant</h3>
              <p>Trouvez des missions flexibles autour de vous, compatibles avec vos études.</p>
              <span className="cta-arrow">Je cherche un job →</span>
            </Link>
            <Link href="/inscription?type=employer" className="cta-card pro" style={{ textDecoration: 'none' }}>
              <span className="cta-emoji-big">💼</span>
              <h3>Professionnelle</h3>
              <p>Recrutez des renforts qualifiés rapidement pour vos missions ponctuelles.</p>
              <span className="cta-arrow">Je recrute →</span>
            </Link>
            <Link href="/inscription?type=autoentrepreneur" className="cta-card" style={{ textDecoration: 'none', borderColor: 'var(--teal)' }}>
              <span className="cta-emoji-big">🧾</span>
              <h3>Auto-entrepreneur</h3>
              <p>Mettez votre profil en avant et soyez contacté directement par vos clients.</p>
              <span className="cta-arrow">Je propose mes services →</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
