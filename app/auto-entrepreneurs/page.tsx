'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

type AutoProfile = {
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
  featured: boolean; // a le pack visibilité actif
};

const METIERS = [
  'Tous',
  'Plomberie', 'Électricité', 'Menuiserie', 'Jardinage', 'Ménage',
  'Peinture', 'Informatique', 'Livraison', 'Cours particuliers', 'Autre',
];

export default function AutoEntrepreneursPage() {
  const [profiles, setProfiles] = useState<AutoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      // Seuls les auto-entrepreneurs avec l'abonnement actif sont visibles
      const { data: packs } = await supabase
        .from('user_purchases')
        .select('user_id')
        .eq('offer_id', 'pack_visibilite_auto')
        .eq('status', 'active');

      if (!packs || packs.length === 0) { setLoading(false); return; }

      const subscribedIds = packs.map((p: { user_id: string }) => p.user_id);

      const { data: autos } = await supabase
        .from('profiles')
        .select('id, nom, ville, avatar_lettre, siret, metier, bio, note_moyenne, nb_missions, xp_total, niveau')
        .eq('statut', 'autoentrepreneur')
        .in('id', subscribedIds)
        .order('xp_total', { ascending: false });

      if (!autos) { setLoading(false); return; }

      const enriched: AutoProfile[] = autos.map(a => ({ ...a, featured: true }));

      setProfiles(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.ville || '').toLowerCase().includes(search.toLowerCase());
    const matchMetier = filtre === 'Tous' || p.metier === filtre;
    return matchSearch && matchMetier;
  });

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Auto-entrepreneurs <span className="teal-text">près de chez vous</span> 🧾</h1>
          <p>Trouvez un indépendant qualifié et contactez-le directement. Devis rapide, sans intermédiaire.</p>
        </div>
      </section>

      {/* BARRE DE RECHERCHE + FILTRES */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: 220,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--cream)', borderRadius: 999,
            padding: '0 16px', border: '1.5px solid var(--border)',
          }}>
            <span>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, ville…"
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '11px 0', fontSize: 14, fontFamily: 'inherit', flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {METIERS.map(m => (
              <button
                key={m}
                onClick={() => setFiltre(m)}
                className={`cat-pill ${filtre === m ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px' }}>
        {loading ? (
          <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="big-emoji">🔍</span>
            <h3>Aucun auto-entrepreneur trouvé</h3>
            <p>Essaie de modifier ta recherche ou le filtre métier.</p>
          </div>
        ) : (
          <div style={gridStyle}>
            {filtered.map(p => <ProfileCard key={p.id} profile={p} />)}
          </div>
        )}

        {/* CTA pour les auto-entrepreneurs */}
        <div className="cta-box" style={{ marginTop: 60 }}>
          <span className="cta-emoji">🧾</span>
          <div className="cta-text">
            <h3>Vous êtes auto-entrepreneur ?</h3>
            <p>Mettez votre profil en avant pour être contacté directement par les pros et particuliers.</p>
          </div>
          <Link href="/offres" className="btn-primary">Voir l'offre →</Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

function ProfileCard({ profile: p }: { profile: AutoProfile }) {
  const initial = (p.nom || '?').charAt(0).toUpperCase();
  const stars = p.note_moyenne ? Math.round(p.note_moyenne) : null;

  return (
    <Link href={`/auto-entrepreneurs/${p.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 18,
        border: p.featured ? '2px solid var(--teal)' : '1px solid var(--border)',
        padding: 20, cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(13,31,45,0.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      >
        {p.featured && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--teal)', color: 'var(--navy)',
            padding: '4px 12px', borderRadius: '0 16px 0 10px',
            fontSize: 11, fontWeight: 800,
          }}>
            ⭐ Mis en avant
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: p.featured ? 'var(--teal)' : 'var(--navy)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.nom}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              📍 {p.ville || 'Ville non renseignée'}
            </p>
            {p.metier && (
              <span style={{
                display: 'inline-block', background: 'var(--cream)',
                border: '1px solid var(--border)', color: 'var(--text-dark)',
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              }}>
                {p.metier}
              </span>
            )}
          </div>
        </div>

        {p.bio && (
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {p.bio}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            {stars && <span>{'⭐'.repeat(stars)} ({p.note_moyenne?.toFixed(1)})</span>}
            {p.nb_missions !== null && p.nb_missions > 0 && <span>✅ {p.nb_missions} mission{p.nb_missions > 1 ? 's' : ''}</span>}
            {p.xp_total !== null && p.xp_total > 0 && <span>⚡ {p.xp_total} XP</span>}
          </div>
          <span style={{
            background: p.featured ? 'var(--teal)' : 'var(--navy)',
            color: p.featured ? 'var(--navy)' : 'white',
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
          }}>
            {p.featured ? 'Contacter →' : 'Voir le profil →'}
          </span>
        </div>
      </div>
    </Link>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};
