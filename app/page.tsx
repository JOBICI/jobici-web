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

export default function Home() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

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
    loadMissions();
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
            <h3>Aucune mission pour l'instant</h3>
            <p>Reviens plus tard ou télécharge l'app pour être notifié.</p>
          </div>
        ) : (
          <div className="missions-grid">
            {filtered.map(m => <MissionCard key={m.id} mission={m} />)}
          </div>
        )}

        <div className="cta-box">
          <span className="cta-emoji">🎯</span>
          <div className="cta-text">
            <h3>Tu cherches une mission spécifique ?</h3>
            <p>Télécharge l'app Jobici pour accéder à toutes les missions près de chez toi en temps réel.</p>
          </div>
          <Link href="/contact" className="btn-primary">Télécharger l'app →</Link>
        </div>
      </main>

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

      {/* DOUBLE CTA */}
      <section className="double-cta">
        <div className="cta-grid">
          <Link href="/pros" className="cta-card pro">
            <span className="cta-emoji-big">💼</span>
            <h3>Vous êtes Pro ?</h3>
            <p>Trouvez des travailleurs qualifiés en quelques minutes pour vos missions ponctuelles ou récurrentes.</p>
            <span className="cta-arrow">Découvrir l'offre Pro →</span>
          </Link>
          <Link href="/travailleurs" className="cta-card worker">
            <span className="cta-emoji-big">👥</span>
            <h3>Tu cherches du travail ?</h3>
            <p>Accède à des missions près de chez toi, avec 0% de commission et un paiement sécurisé.</p>
            <span className="cta-arrow">Voir les missions →</span>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
