'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

const BG_COLORS: Record<string, string> = {
  '📦': 'linear-gradient(135deg, #E0F7F3, #C5F0E8)',
  '🌿': 'linear-gradient(135deg, #DFFBE3, #B8F0C0)',
  '👶': 'linear-gradient(135deg, #FFE9F5, #FFC8E8)',
  '🧹': 'linear-gradient(135deg, #E0F7F3, #ADE8D9)',
  '🔧': 'linear-gradient(135deg, #FFE6CC, #FFCC99)',
  '🛵': 'linear-gradient(135deg, #FFF3CD, #FFE69C)',
  '📚': 'linear-gradient(135deg, #E5E7FF, #CBD5F0)',
  '🛍️': 'linear-gradient(135deg, #FFE5E5, #FFD1D1)',
  '🍽️': 'linear-gradient(135deg, #FFE4E1, #FFC8C2)',
  '🎨': 'linear-gradient(135deg, #FFF5E0, #FFEBC2)',
  '🎯': 'linear-gradient(135deg, #F0F0F0, #E0E0E0)',
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('missions')
        .select('*')
        .eq('statut', 'active')
        .order('created_at', { ascending: false });
      if (data) setMissions(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = missions.filter(m => {
    const titre = (m.titre || '').toLowerCase();
    const ville = (m.ville || '').toLowerCase();
    const matchSearch = !search || titre.includes(search.toLowerCase()) || ville.includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return m.est_urgent;
    const map: Record<string, string[]> = {
      menage: ['ménage', 'nettoy'], jardinage: ['jardin', 'tonte', 'pelouse'],
      garde: ['garde', 'enfant', 'baby'], demenagement: ['démén', 'transport'],
      bricolage: ['bricolage', 'monta', 'peintur'], livraison: ['livr', 'course'],
      cours: ['cours', 'soutien'], vente: ['vente', 'vendeur'],
    };
    return (map[activeFilter] || []).some(kw => titre.includes(kw));
  });

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Missions <span className="teal-text">disponibles</span> 🎯</h1>
          <p>Trouvez une mission près de chez vous et postulez en quelques secondes.</p>
        </div>
      </section>

      {/* BARRE RECHERCHE + FILTRES */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream)', borderRadius: 999, padding: '0 16px', border: '1.5px solid var(--border)' }}>
            <span>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Titre, ville…"
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '11px 0', fontSize: 14, fontFamily: 'inherit', flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`cat-pill ${activeFilter === f.id ? 'active' : ''}`}>
                {f.label}
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
            <h3>Aucune mission disponible pour le moment</h3>
            <p>Revenez plus tard, de nouvelles missions sont publiées régulièrement.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(m => <MissionListCard key={m.id} mission={m} />)}
          </div>
        )}

        <div className="cta-box" style={{ marginTop: 60 }}>
          <span className="cta-emoji">📋</span>
          <div className="cta-text">
            <h3>Vous avez une mission à confier ?</h3>
            <p>Publiez votre annonce et trouvez un travailleur qualifié en quelques heures.</p>
          </div>
          <Link href="/publier-mission" className="btn-primary">Publier une mission →</Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

function MissionListCard({ mission: m }: { mission: Mission }) {
  const bg = BG_COLORS[m.emoji] || BG_COLORS['🎯'];
  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(13,31,45,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <Link href={`/missions/${m.id}`} style={{ textDecoration: 'none', flex: 1 }}>
        <div style={{ background: bg, padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <span style={{ fontSize: 36 }}>{m.emoji || '🎯'}</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 3 }}>{m.titre}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>📍 {m.ville} · ⏱ {m.duree || '—'}</p>
          </div>
          {m.est_urgent && (
            <span style={{ position: 'absolute', top: 12, right: 12, background: 'var(--urgent)', color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>⚡ Urgent</span>
          )}
        </div>
        <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal-dark)' }}>{m.tarif}€</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </Link>
      <div style={{ padding: '0 16px 16px' }}>
        <Link href={`/missions/${m.id}`} style={{
          display: 'block', textAlign: 'center', background: 'var(--teal)', color: 'var(--navy)',
          padding: '11px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none',
        }}>
          Postuler →
        </Link>
      </div>
    </div>
  );
}
