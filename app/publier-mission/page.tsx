'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

// Suggestions emoji selon catégorie
const EMOJI_AUTO: Record<string, string> = {
  'ménage': '🧹', 'menage': '🧹', 'nettoy': '🧹',
  'jardin': '🌿', 'tonte': '🌿', 'pelouse': '🌿',
  'enfant': '👶', 'garde': '👶', 'baby': '👶',
  'démén': '📦', 'demenagement': '📦', 'transport': '📦',
  'bricolage': '🔧', 'monta': '🔧', 'répar': '🔧',
  'livr': '🛵', 'course': '🛵',
  'cours': '📚', 'soutien': '📚',
  'vente': '🛍️', 'vendeur': '🛍️', 'boutique': '🛍️',
  'serveur': '🍽️', 'restaurant': '🍽️', 'cuisine': '🍽️',
  'chien': '🐕', 'animal': '🐕',
  'peintur': '🎨',
  'admin': '💼', 'secrét': '💼',
};

function getEmoji(titre: string): string {
  const t = titre.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_AUTO)) {
    if (t.includes(key)) return emoji;
  }
  return '🎯';
}

// Offres de boost (reprises de l'app)
const BOOSTS = [
  { id: 'aucun',    emoji: '📄', titre: 'Publication standard', prix: 0, badge: null,        desc: 'Votre annonce est publiée normalement. Gratuit.' },
  { id: 'remontee', emoji: '🚀', titre: "Remontée d'annonce",   prix: 2, badge: null,        desc: 'En tête des résultats pendant 3 jours + badge "Récent".' },
  { id: 'sos',      emoji: '🔥', titre: 'SOS Annonce',          prix: 5, badge: 'POPULAIRE', desc: 'Notification push immédiate envoyée à tous les travailleurs.' },
];

export default function PublierMissionPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [titre, setTitre]         = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille]         = useState('');
  const [duree, setDuree]         = useState('');
  const [dureeMois, setDureeMois] = useState('');
  const [date, setDate]           = useState('');
  const [horaires, setHoraires]   = useState('');
  const [tarif, setTarif]         = useState('');
  const [boost, setBoost]         = useState('aucun');
  const [profilRequis, setProfilRequis] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
  }, [user, authLoading, router]);

  // ── Suggestion de tarif intelligente : plancher 15€ + fourchette réaliste ──
  const d = parseFloat(duree) || 0;
  const FLOOR = 15;
  const tarifBas  = d > 0 ? Math.max(FLOOR, Math.round(d * 15)) : null;
  const tarifHaut = d > 0 ? Math.max(20,    Math.round(d * 22)) : null;

  // ── Commission : 15% particulier (CESU) / 20% pro (avec dégressif multi-mois) ──
  const isPro = userProfile?.statut === 'employer' || userProfile?.statut === 'autoentrepreneur';
  const tarifNum = parseFloat(tarif) || 0;
  const moisNum = isPro ? (parseInt(dureeMois) || 0) : 0;
  const boostCost = BOOSTS.find(b => b.id === boost)?.prix || 0;

  // Pour les pros avec durée en mois : mois 1 à 20%, mois suivants à 15%
  const commissionMois1 = isPro && moisNum > 0 ? Math.round(tarifNum * 0.20 * 100) / 100 : 0;
  const commissionAutresMois = isPro && moisNum > 1 ? Math.round(tarifNum * 0.15 * (moisNum - 1) * 100) / 100 : 0;
  const commissionMontant = isPro && moisNum > 0
    ? Math.round((commissionMois1 + commissionAutresMois) * 100) / 100
    : Math.round(tarifNum * (isPro ? 0.20 : 0.15) * 100) / 100;
  const coutTotal = Math.round((tarifNum * Math.max(moisNum, 1) + commissionMontant + boostCost) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    const isParticulier = userProfile?.statut === 'particulier';

    const missionData = {
      employeur_id: user.id,
      titre: titre.trim(),
      description: description.trim(),
      ville: ville.trim(),
      emoji: getEmoji(titre),
      type: 'Mission',
      duree: duree ? `${duree}h` : '',
      date_mission: date,
      horaires: horaires.trim(),
      profil_requis: profilRequis.trim(),
      tarif: parseFloat(tarif),
      est_urgent: boost === 'sos',
      boost: boost,
      statut: isParticulier ? 'en_attente_paiement' : 'active',
      ...(isPro && moisNum > 0 && { duree_mois: moisNum, commission_totale: commissionMontant }),
      ...(isParticulier && { statut_paiement: 'en_attente', montant_paye: coutTotal }),
    };

    const { data: newMission, error: dbError } = await supabase
      .from('missions')
      .insert(missionData)
      .select('id')
      .single();

    setLoading(false);

    if (dbError || !newMission) {
      setError(`Erreur : ${dbError?.message || 'Impossible de créer la mission'}`);
      return;
    }

    // Particulier → paiement Stripe obligatoire
    if (isParticulier) {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: 'mission_publication',
          missionId: newMission.id,
          missionTitre: titre.trim(),
          montant: Math.round(coutTotal * 100),
          userId: user.id,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      window.location.href = data.url;
      return;
    }

    alert('✅ Mission publiée avec succès !');
    router.push('/missions');
  }

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

  if (!user) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <span style={{ fontSize: 60, marginBottom: 16 }}>🔒</span>
          <h2 style={{ color: 'var(--navy)', fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
            Connexion requise
          </h2>
          <p style={{ color: 'var(--text-mid)', textAlign: 'center', marginBottom: 24, maxWidth: 400 }}>
            Vous devez être connecté pour publier une mission.
          </p>
          <Link href="/connexion" className="btn-primary">Se connecter →</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Publier une mission 📋</h1>
          <p>Décrivez votre besoin et trouvez le travailleur idéal en quelques heures.</p>
        </div>
      </section>

      <section style={{ padding: '40px 20px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit}>

            <label style={labelStyle}>Titre de la mission *</label>
            <input
              type="text" required value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex : Tonte de pelouse, jardin de 100m²"
              style={inputStyle} maxLength={80}
            />
            {titre && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Emoji suggéré : <span style={{ fontSize: 20 }}>{getEmoji(titre)}</span>
              </p>
            )}

            <label style={labelStyle}>Description détaillée *</label>
            <textarea
              required value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez les tâches, le contexte, les attentes..."
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              maxLength={1000}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Ville *</label>
                <input type="text" required value={ville}
                  onChange={e => setVille(e.target.value)}
                  placeholder="Ex : Valence" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Durée (heures) *</label>
                <input type="number" required min="0.5" step="0.5" value={duree}
                  onChange={e => setDuree(e.target.value)}
                  placeholder="Ex : 2" style={inputStyle} />
              </div>
            </div>

            {isPro && (
              <div>
                <label style={labelStyle}>Durée du contrat (mois)</label>
                <input type="number" min="1" step="1" value={dureeMois}
                  onChange={e => setDureeMois(e.target.value)}
                  placeholder="Ex : 3 (laisser vide si mission ponctuelle)"
                  style={inputStyle} />
                {moisNum > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Commission : 20% le 1er mois, 15% les mois suivants
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={date}
                  onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Horaires</label>
                <input type="text" value={horaires}
                  onChange={e => setHoraires(e.target.value)}
                  placeholder="Ex : 14h-18h" style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Profil recherché</label>
            <input type="text" value={profilRequis}
              onChange={e => setProfilRequis(e.target.value)}
              placeholder="Ex : Expérience en jardinage appréciée" style={inputStyle} />

            <label style={labelStyle}>Tarif proposé (€) *</label>
            <input type="number" required min="15" step="0.01" value={tarif}
              onChange={e => setTarif(e.target.value)}
              placeholder="Ex : 30" style={inputStyle} />

            {tarifBas && tarifHaut && (
              <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 10, padding: 12, marginTop: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--teal-dark)', fontWeight: 700 }}>
                  💡 Tarif conseillé : entre {tarifBas}€ et {tarifHaut}€ pour {duree}h
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 4 }}>
                  Minimum 15€ par mission. Un tarif juste attire plus de candidats sérieux.
                </p>
              </div>
            )}

            {/* ═══ SECTION BOOST ═══ */}
            <div style={{ marginTop: 28 }}>
              <label style={{ ...labelStyle, marginTop: 0, fontSize: 15 }}>🚀 Boostez votre annonce</label>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Augmentez la visibilité de votre mission pour trouver plus vite (optionnel).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BOOSTS.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBoost(b.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 16, textAlign: 'left', cursor: 'pointer',
                      background: boost === b.id ? 'var(--teal-light)' : 'white',
                      border: `2px solid ${boost === b.id ? 'var(--teal)' : 'var(--border)'}`,
                      borderRadius: 12, fontFamily: 'inherit', width: '100%',
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{b.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{b.titre}</span>
                        {b.badge && (
                          <span style={{ background: 'var(--urgent)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                            {b.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{b.desc}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 900, color: b.prix === 0 ? 'var(--text-muted)' : 'var(--teal-dark)', flexShrink: 0 }}>
                      {b.prix === 0 ? 'Gratuit' : `+${b.prix}€`}
                    </span>
                  </button>
                ))}
              </div>

              {boostCost > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                  Le paiement du boost sera disponible prochainement (à l'activation des paiements en ligne).
                </p>
              )}
            </div>

            {/* ═══ RÉCAPITULATIF COÛT ═══ */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginTop: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
                💰 Récapitulatif
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-mid)' }}>Le travailleur reçoit (100% du tarif)</span>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{tarifNum || 0}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-mid)' }}>
                    Commission Jobici ({!isPro ? '15%, mandat CESU' : moisNum > 0 ? '20% M1 + 15% suivants HT' : '20% HT'})
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{commissionMontant}€</span>
                </div>
                {isPro && moisNum > 0 && (
                  <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)', marginLeft: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>Mois 1 (20%)</span>
                      <span>{commissionMois1}€</span>
                    </div>
                    {moisNum > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Mois 2{moisNum > 2 ? ` à ${moisNum}` : ''} (15% × {moisNum - 1})</span>
                        <span>{commissionAutresMois}€</span>
                      </div>
                    )}
                  </div>
                )}
                {boostCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-mid)' }}>Boost annonce</span>
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{boostCost}€</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: 'var(--navy)' }}>Coût total pour vous</span>
                  <span style={{ fontWeight: 900, color: 'var(--teal-dark)', fontSize: 16 }}>{coutTotal}€</span>
                </div>
              </div>
              {!isPro && (
                <p style={{ fontSize: 11, color: 'var(--teal-dark)', marginTop: 10, lineHeight: 1.5 }}>
                  ✨ En tant que particulier, vous bénéficiez de <strong>50% de crédit d'impôt</strong> sur le tarif versé au travailleur (Services à la Personne).
                </p>
              )}
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 16, fontWeight: 600 }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Publication...' : '🚀 Publier la mission'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit',
};
const btnStyle: React.CSSProperties = {
  width: '100%', background: 'var(--teal)', color: 'var(--navy)', padding: 14,
  border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 24,
  fontFamily: 'inherit',
};