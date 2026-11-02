'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MaillageLinks from '@/components/MaillageLinks';
import { supabase } from '@/lib/supabase';
import { SUGGESTIONS_METIER } from '@/lib/metiers';

type AutoProfile = {
  id: string;
  nom: string;
  nom_commercial: string | null;
  ville: string;
  avatar_lettre: string;
  siret: string;
  metier: string | null;
  bio: string | null;
  competences: string[] | null;
  tarif_horaire: number | null;
  disponible: boolean | null;
  note_moyenne: number | null;
  nb_missions: number | null;
  xp_total: number | null;
  niveau: number | null;
  featured: boolean; // a le pack visibilité actif
  note_google: number | null;
  nb_avis_google: number | null;
};

const FILTRES_RAPIDES = ['Tous', ...SUGGESTIONS_METIER.slice(0, 8)];

export default function AutoEntrepreneursPage() {
  const [profiles, setProfiles] = useState<AutoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      // Tous les auto-entrepreneurs sont visibles ; le pack visibilité ne fait
      // que les mettre en avant (tri + badge), ce n'est plus une condition d'accès.
      const [{ data: autos }, { data: packs }, { data: googleAvis }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nom, nom_commercial, ville, avatar_lettre, siret, metier, bio, competences, tarif_horaire, disponible, note_moyenne, nb_missions, xp_total, niveau')
          .eq('statut', 'autoentrepreneur'),
        supabase
          .from('user_purchases')
          .select('user_id')
          .eq('offer_id', 'pack_visibilite_auto')
          .eq('status', 'active'),
        supabase
          .from('avis_google')
          .select('profile_id, note, nb_avis'),
      ]);

      if (!autos) { setLoading(false); return; }

      const featuredIds = new Set((packs ?? []).map((p: { user_id: string }) => p.user_id));
      const googleById = new Map((googleAvis ?? []).map((g: { profile_id: string; note: number | null; nb_avis: number | null }) => [g.profile_id, g]));
      const enriched: AutoProfile[] = autos
        .map(a => ({
          ...a,
          featured: featuredIds.has(a.id),
          note_google: googleById.get(a.id)?.note ?? null,
          nb_avis_google: googleById.get(a.id)?.nb_avis ?? null,
        }))
        .sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return (b.note_moyenne || 0) - (a.note_moyenne || 0) || (b.xp_total || 0) - (a.xp_total || 0);
        });

      setProfiles(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.ville || '').toLowerCase().includes(search.toLowerCase());
    const matchMetier = filtre === 'Tous' || (p.metier || '').toLowerCase().includes(filtre.toLowerCase());
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
            {FILTRES_RAPIDES.map(m => (
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
            <p>Essayez de modifier votre recherche ou le filtre métier.</p>
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

      <MaillageLinks current="/auto-entrepreneurs" />

      <Footer />
    </>
  );
}

function ProfileCard({ profile: p }: { profile: AutoProfile }) {
  const displayName = p.nom_commercial?.trim() || p.nom;
  const initial = (displayName || '?').charAt(0).toUpperCase();
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
              {displayName}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              📍 {p.ville || 'Ville non renseignée'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.metier && (
                <span style={{
                  display: 'inline-block', background: 'var(--cream)',
                  border: '1px solid var(--border)', color: 'var(--text-dark)',
                  padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                }}>
                  {p.metier}
                </span>
              )}
              {p.disponible !== false ? (
                <span style={{ display: 'inline-block', background: 'var(--teal-light)', color: 'var(--teal-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  ✅ Disponible
                </span>
              ) : (
                <span style={{ display: 'inline-block', background: 'var(--cream)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  ⏸️ Indisponible
                </span>
              )}
            </div>
          </div>
        </div>

        {p.bio && (
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {p.bio}
          </p>
        )}

        {p.competences && p.competences.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {p.competences.slice(0, 3).map(tag => (
              <span key={tag} style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {stars && <span>{'⭐'.repeat(stars)} ({p.note_moyenne?.toFixed(1)})</span>}
            {p.nb_missions !== null && p.nb_missions > 0 && <span>✅ {p.nb_missions} mission{p.nb_missions > 1 ? 's' : ''}</span>}
            {p.xp_total !== null && p.xp_total > 0 && <span>⚡ {p.xp_total} XP</span>}
            {p.tarif_horaire != null && <span>💶 {p.tarif_horaire}€/h</span>}
          </div>
          <span style={{
            background: p.featured ? 'var(--teal)' : 'var(--navy)',
            color: p.featured ? 'var(--navy)' : 'white',
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
          }}>
            {p.featured ? 'Contacter →' : 'Voir le profil →'}
          </span>
        </div>

        {p.note_google !== null && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            🔍 Google : {'⭐'.repeat(Math.round(p.note_google))} {p.note_google.toFixed(1)}
            {p.nb_avis_google != null && ` (${p.nb_avis_google} avis)`}
          </div>
        )}
      </div>
    </Link>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};
