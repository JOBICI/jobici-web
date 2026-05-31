'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

/* ─── Types ─────────────────────────────────────────── */
type OfferId =
  | 'boost_annonce'
  | 'sos_annonce'
  | 'pack_mensuel_particulier'
  | 'pack_mensuel_pro'
  | 'pack_visibilite_travailleur'
  | 'pack_visibilite_auto';

type Tab = 'particulier' | 'pro' | 'travailleur' | 'auto-entrepreneur' | 'code-promo';

/* ─── Onglets ────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: 'particulier',       label: '🏠 Particulier' },
  { id: 'pro',               label: '💼 Professionnel' },
  { id: 'travailleur',       label: '👷 Travailleur' },
  { id: 'auto-entrepreneur', label: '🧾 Auto-entrepreneur' },
  { id: 'code-promo',        label: '🎁 Code promo' },
];

const TAB_COLOR: Record<Tab, string> = {
  particulier:       '#3B82F6',
  pro:               '#0D1F2D',
  travailleur:       '#0ABFA3',
  'auto-entrepreneur': '#C9A84C',
  'code-promo':      '#E8445A',
};

/* ─── Helpers paiement ───────────────────────────────── */
async function startCheckout(
  offerId: OfferId,
  opts: { missionId?: string; promoCode?: string; userEmail?: string; userId?: string },
) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerId, ...opts }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  window.location.href = data.url;
}

/* ─── Composant carte d'offre ────────────────────────── */
function OfferCard({
  emoji,
  badge,
  title,
  price,
  priceDetail,
  bullets,
  offerId,
  onBuy,
  color,
  requiresMission,
  isSub,
  isLoading,
}: {
  emoji: string;
  badge?: string;
  title: string;
  price: string;
  priceDetail: string;
  bullets: string[];
  offerId: OfferId;
  onBuy: (id: OfferId, needsMission: boolean) => void;
  color: string;
  requiresMission?: boolean;
  isSub?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 20,
      border: `1.5px solid ${color}25`,
      padding: '28px 24px',
      display: 'flex', flexDirection: 'column', gap: 0,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{emoji}</span>
        <div>
          {badge && (
            <span style={{
              display: 'inline-block', marginBottom: 2,
              background: `${color}15`, color,
              padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            }}>
              {badge}
            </span>
          )}
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>{title}</h3>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 38, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{price}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>{priceDetail}</span>
      </div>

      <ul style={{ listStyle: 'none', marginBottom: 24, flex: 1 }}>
        {bullets.map(b => (
          <li key={b} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.5 }}>
            <span style={{ color, fontWeight: 800, flexShrink: 0 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isLoading && onBuy(offerId, !!requiresMission)}
        disabled={isLoading}
        style={{
          width: '100%', background: isLoading ? 'var(--border)' : color,
          color: isLoading ? 'var(--text-muted)' : offerId === 'pack_mensuel_pro' ? 'white' : 'var(--navy)',
          border: 'none', borderRadius: 12,
          padding: '14px', fontWeight: 800, fontSize: 14,
          cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        {isLoading
          ? '⏳ Chargement…'
          : isSub
            ? `S'abonner — ${price}`
            : requiresMission
              ? `Choisir une annonce — ${price}`
              : `Acheter — ${price}`}
      </button>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────── */
export default function OffresPage() {
  const [tab, setTab] = useState<Tab>('particulier');
  // loadingOffer : l'offre en cours d'achat (pour griser le bon bouton)
  const [loadingOffer, setLoadingOffer] = useState<OfferId | null>(null);
  // toast fixe en haut de l'écran
  const [toast, setToast] = useState<{ type: 'error' | 'info'; msg: string } | null>(null);

  // Modal de sélection de mission
  const [missionModal, setMissionModal] = useState<{ offerId: OfferId } | null>(null);
  const [missions, setMissions] = useState<{ id: string; titre: string }[]>([]);
  const [selectedMission, setSelectedMission] = useState('');

  // Code promo
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // User
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? '');
        setUserId(data.user.id ?? '');
      }
    });
  }, []);

  function showToast(type: 'error' | 'info', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  }

  async function fetchMissions() {
    const { data } = await supabase
      .from('missions')
      .select('id, titre')
      .eq('employeur_id', userId)
      .eq('statut', 'active')
      .order('created_at', { ascending: false });
    setMissions(data ?? []);
  }

  async function handleBuy(offerId: OfferId, needsMission: boolean) {
    if (loadingOffer) return;
    if (needsMission) {
      setLoadingOffer(offerId);
      await fetchMissions();
      setLoadingOffer(null);
      setMissionModal({ offerId });
      return;
    }
    await checkout(offerId);
  }

  async function checkout(offerId: OfferId, missionId?: string) {
    setLoadingOffer(offerId);
    showToast('info', '⏳ Redirection vers le paiement sécurisé…');
    try {
      await startCheckout(offerId, { missionId, promoCode: promoCode || undefined, userEmail, userId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      showToast('error', msg);
    } finally {
      setLoadingOffer(null);
    }
  }

  async function confirmMission() {
    if (!missionModal) return;
    const { offerId } = missionModal;
    setMissionModal(null);
    await checkout(offerId, selectedMission || undefined);
  }

  async function checkPromo() {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: 'pack_mensuel_particulier', promoCode: promoInput.trim() }),
      });
      const data = await res.json();
      // Si la seule erreur est le code promo, le code est invalide
      if (data.error === 'Code promo invalide ou expiré') {
        setPromoStatus('invalid');
      } else if (data.error) {
        // Autre erreur (ex: Stripe non configuré) → on accepte quand même
        // le code localement, il sera validé par Stripe au moment du paiement
        setPromoStatus('valid');
        setPromoCode(promoInput.trim());
      } else {
        // Session créée → code valide (on ne redirige pas, juste la validation)
        setPromoStatus('valid');
        setPromoCode(promoInput.trim());
        showToast('info', '✅ Code promo validé ! Il sera appliqué à ta prochaine commande.');
      }
    } catch {
      setPromoStatus('invalid');
    } finally {
      setPromoChecking(false);
    }
  }

  const color = TAB_COLOR[tab];

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="page-hero">
        <div className="container">
          <h1>Offres <span className="teal-text">Jobici</span></h1>
          <p>Boostez vos annonces, augmentez votre visibilité. Des offres adaptées à chaque profil.</p>
          {promoCode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
              background: 'rgba(10,191,163,0.12)', color: 'var(--teal-dark)',
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            }}>
              🎁 Code promo actif : <strong>{promoCode}</strong>
              <button onClick={() => { setPromoCode(''); setPromoStatus('idle'); setPromoInput(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--teal-dark)', lineHeight: 1 }}>
                ×
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ONGLETS */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '16px 18px',
                border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: tab === t.id ? 800 : 600,
                color: tab === t.id ? TAB_COLOR[t.id] : 'var(--text-mid)',
                borderBottom: tab === t.id ? `3px solid ${TAB_COLOR[t.id]}` : '3px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast fixe — visible quelle que soit la position de scroll */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.type === 'error' ? '#B91C1C' : 'var(--navy)',
          color: 'white',
          padding: '14px 24px', borderRadius: 12,
          fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          maxWidth: 'min(480px, 90vw)', textAlign: 'center',
          animation: 'slideDown 0.25s ease-out',
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }`}</style>

      {/* ─── PARTICULIER ─────────────────────────────────── */}
      {tab === 'particulier' && (
        <main style={mainStyle}>
          <div style={headerStyle}>
            <h2 style={h2Style}>Boostez vos annonces 🏠</h2>
            <p style={subtitleStyle}>Deux offres ponctuelles par annonce, ou un abonnement pour une liberté totale.</p>
          </div>
          <div style={gridStyle}>
            <OfferCard
              emoji="🚀"
              title="Remonter mon annonce"
              price="2 €"
              priceDetail="paiement unique"
              bullets={[
                'Annonce repositionnée en tête pendant 3 jours',
                'Visible en premier dans les recherches',
                'Badge "Récent" affiché sur la carte',
              ]}
              offerId="boost_annonce"
              onBuy={handleBuy}
              color={color}
              requiresMission
              isLoading={loadingOffer === 'boost_annonce'}
            />
            <OfferCard
              emoji="⚡"
              badge="Populaire"
              title="SOS Annonce"
              price="4,99 €"
              priceDetail="paiement unique"
              bullets={[
                'Notification push immédiate à tous les travailleurs disponibles',
                'Annonce épinglée en tête pendant 7 jours',
                'Badge "Urgent" visible sur la carte',
                'Réponse garantie sous 2 heures',
              ]}
              offerId="sos_annonce"
              onBuy={handleBuy}
              color={color}
              requiresMission
              isLoading={loadingOffer === 'sos_annonce'}
            />
            <OfferCard
              emoji="🎯"
              badge="Meilleure offre"
              title="Pack Mensuel"
              price="9,99 €"
              priceDetail="/ mois · engagement 3 mois"
              bullets={[
                'SOS Annonce inclus sur toutes vos annonces',
                'Notification push illimitée',
                'Toutes les annonces épinglées prioritaires',
                'Engagement minimum 3 mois, résiliable ensuite.',
              ]}
              offerId="pack_mensuel_particulier"
              onBuy={handleBuy}
              color={color}
              isSub
              isLoading={loadingOffer === 'pack_mensuel_particulier'}
            />
          </div>
          <p style={noteStyle}>
            💳 Paiement sécurisé via Stripe. Les offres ponctuelles s'appliquent à une annonce de votre choix.
          </p>
        </main>
      )}

      {/* ─── PRO ─────────────────────────────────────────── */}
      {tab === 'pro' && (
        <main style={mainStyle}>
          <div style={headerStyle}>
            <h2 style={h2Style}>Offres Professionnels 💼</h2>
            <p style={subtitleStyle}>Recrutez en urgence, gérez vos renforts sans contrainte.</p>
          </div>
          <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: 720, margin: '0 auto' }}>
            <OfferCard
              emoji="⚡"
              badge="Engagement 3 mois"
              title="Pack Mensuel Pro"
              price="9,99 €"
              priceDetail="/ mois · engagement 3 mois"
              bullets={[
                'SOS Annonce illimité sur toutes vos annonces',
                'Notification push immédiate à tous les travailleurs',
                'Toutes les annonces épinglées en priorité',
                'Badge "Urgent" automatique sur chaque annonce SOS',
                'Réponse garantie sous 2 heures par annonce',
                'Engagement minimum 3 mois, résiliable ensuite.',
              ]}
              offerId="pack_mensuel_pro"
              onBuy={handleBuy}
              color={color}
              isSub
              isLoading={loadingOffer === 'pack_mensuel_pro'}
            />
          </div>
          <p style={noteStyle}>
            🧾 Facturation HT automatique à chaque renouvellement mensuel. La commission de 20 % HT sur les missions reste inchangée.
          </p>
        </main>
      )}

      {/* ─── TRAVAILLEUR ──────────────────────────────────── */}
      {tab === 'travailleur' && (
        <main style={mainStyle}>
          <div style={headerStyle}>
            <h2 style={h2Style}>Sois vu en premier 👷</h2>
            <p style={subtitleStyle}>Postule avant tout le monde et fais remonter ton profil auprès des recruteurs.</p>
          </div>
          <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: 720, margin: '0 auto' }}>
            <OfferCard
              emoji="⭐"
              badge="Engagement 3 mois"
              title="Pack Visibilité Travailleur"
              price="9,99 €"
              priceDetail="/ mois · engagement 3 mois"
              bullets={[
                'Profil mis en avant dans les résultats — vu en premier par les pros',
                'Notification 30 minutes avant la publication de chaque annonce pour postuler en avance',
                'Accès prioritaire aux missions urgentes',
                'Badge "Pro" sur ton profil',
                'Engagement minimum 3 mois, résiliable ensuite.',
              ]}
              offerId="pack_visibilite_travailleur"
              onBuy={handleBuy}
              color={color}
              isSub
              isLoading={loadingOffer === 'pack_visibilite_travailleur'}
            />
          </div>
          <p style={noteStyle}>
            ℹ️ L'inscription et l'accès aux missions restent 100 % gratuits. Ce pack donne uniquement un avantage de visibilité.
          </p>
        </main>
      )}

      {/* ─── AUTO-ENTREPRENEUR ───────────────────────────── */}
      {tab === 'auto-entrepreneur' && (
        <main style={mainStyle}>
          <div style={headerStyle}>
            <h2 style={h2Style}>Développe ton activité 🧾</h2>
            <p style={subtitleStyle}>Mets ton profil en avant et laisse les clients venir à toi directement.</p>
          </div>
          <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: 720, margin: '0 auto' }}>
            <OfferCard
              emoji="🧾"
              badge="Engagement 3 mois"
              title="Pack Visibilité Auto-Entrepreneur"
              price="9,99 €"
              priceDetail="/ mois · engagement 3 mois"
              bullets={[
                'Profil mis en avant dans les résultats de recherche',
                'Les professionnels peuvent te contacter directement',
                'Les particuliers peuvent te contacter directement',
                'Badge "Vérifié Auto-Entrepreneur" sur ton profil',
                'Accès aux missions pro exclusives',
                'Engagement minimum 3 mois, résiliable ensuite.',
              ]}
              offerId="pack_visibilite_auto"
              onBuy={handleBuy}
              color={color}
              isSub
              isLoading={loadingOffer === 'pack_visibilite_auto'}
            />
          </div>
          <p style={noteStyle}>
            ℹ️ Tu factures toujours via ton propre statut auto-entrepreneur. Jobici ne prend aucune commission sur tes gains.
          </p>
        </main>
      )}

      {/* ─── CODE PROMO ──────────────────────────────────── */}
      {tab === 'code-promo' && (
        <main style={{ maxWidth: 520, margin: '60px auto', padding: '0 20px 80px' }}>
          <div style={{
            background: 'white', borderRadius: 24,
            border: '1.5px solid var(--border)',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>🎁</span>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy)', letterSpacing: -0.5, marginBottom: 8 }}>
              Tu as un code promo ?
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 28 }}>
              Entre ton code ci-dessous pour bénéficier d'une réduction sur ta prochaine offre Jobici.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoStatus('idle'); }}
                placeholder="EX : JOBICI20"
                style={{
                  flex: 1, padding: '13px 16px',
                  border: `1.5px solid ${promoStatus === 'valid' ? 'var(--teal)' : promoStatus === 'invalid' ? 'var(--urgent)' : 'var(--border)'}`,
                  borderRadius: 10, fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', outline: 'none',
                  background: 'var(--cream)', letterSpacing: 1,
                  color: 'var(--navy)',
                }}
                onKeyDown={e => e.key === 'Enter' && checkPromo()}
              />
              <button
                onClick={checkPromo}
                disabled={promoChecking || !promoInput.trim()}
                style={{
                  background: 'var(--navy)', color: 'white',
                  border: 'none', borderRadius: 10,
                  padding: '13px 20px', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  opacity: promoChecking || !promoInput.trim() ? 0.5 : 1,
                }}
              >
                {promoChecking ? '…' : 'Valider'}
              </button>
            </div>

            {promoStatus === 'valid' && (
              <div style={{
                background: 'var(--teal-light)', color: 'var(--teal-dark)',
                padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                marginBottom: 20,
              }}>
                ✅ Code valide ! La réduction sera appliquée à ta prochaine commande.
              </div>
            )}
            {promoStatus === 'invalid' && (
              <div style={{
                background: '#FEF2F2', color: '#B91C1C',
                padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                marginBottom: 20,
              }}>
                ❌ Code promo invalide ou expiré.
              </div>
            )}

            {promoStatus === 'valid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 4 }}>
                  Choisis maintenant l'offre à laquelle appliquer ton code :
                </p>
                {([
                  { id: 'pack_mensuel_particulier',    label: 'Pack Mensuel Particulier — 9,99 €/mois' },
                  { id: 'pack_mensuel_pro',            label: 'Pack Mensuel Pro — 9,99 €/mois' },
                  { id: 'pack_visibilite_travailleur', label: 'Pack Visibilité Travailleur — 9,99 €/mois' },
                  { id: 'pack_visibilite_auto',        label: 'Pack Visibilité Auto-Entrepreneur — 9,99 €/mois' },
                  { id: 'boost_annonce',               label: 'Remonter mon annonce — 2 €' },
                  { id: 'sos_annonce',                 label: 'SOS Annonce — 4,99 €' },
                ] as { id: OfferId; label: string }[]).map(o => (
                  <button
                    key={o.id}
                    onClick={() => handleBuy(o.id, o.id === 'boost_annonce' || o.id === 'sos_annonce')}
                    style={{
                      width: '100%', background: 'var(--cream)',
                      border: '1.5px solid var(--border)', borderRadius: 10,
                      padding: '12px 16px', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit', color: 'var(--navy)',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {promoStatus === 'idle' && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Les codes promo sont distribués lors d'événements, partenariats ou par l'équipe Jobici.
              </p>
            )}
          </div>
        </main>
      )}

      {/* ─── MODAL SÉLECTION DE MISSION ──────────────────── */}
      {missionModal && (
        <>
          <div
            onClick={() => setMissionModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', zIndex: 9000, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 20,
            padding: '32px 28px', zIndex: 9001,
            width: 'min(500px, 90vw)',
            boxShadow: '0 24px 64px rgba(13,31,45,0.2)',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
              Choisir une annonce
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20 }}>
              Sélectionne l'annonce à laquelle appliquer cette offre.
            </p>

            {missions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Aucune annonce active trouvée.{' '}
                <Link href="/publier-mission" style={{ color: 'var(--teal)', fontWeight: 700 }}>
                  Publier une mission →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 240, overflowY: 'auto' }}>
                {missions.map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    border: `1.5px solid ${selectedMission === m.id ? 'var(--teal)' : 'var(--border)'}`,
                    background: selectedMission === m.id ? 'var(--teal-light)' : 'var(--cream)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input
                      type="radio"
                      name="mission"
                      value={m.id}
                      checked={selectedMission === m.id}
                      onChange={() => setSelectedMission(m.id)}
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{m.titre}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMissionModal(null)}
                style={{ padding: '12px 20px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}
              >
                Annuler
              </button>
              <button
                onClick={confirmMission}
                disabled={!selectedMission && missions.length > 0}
                style={{
                  padding: '12px 24px', background: 'var(--teal)', color: 'var(--navy)',
                  border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 800, fontSize: 14, opacity: (!selectedMission && missions.length > 0) ? 0.5 : 1,
                }}
              >
                Payer →
              </button>
            </div>
          </div>
        </>
      )}

      {/* CTA FINAL */}
      {tab !== 'code-promo' && (
        <section className="missions-section" style={{ paddingTop: 0, paddingBottom: 60 }}>
          <div className="cta-box">
            <span className="cta-emoji">🎁</span>
            <div className="cta-text">
              <h3>Tu as un code promo ?</h3>
              <p>Applique-le avant d'acheter pour bénéficier d'une réduction sur n'importe quelle offre.</p>
            </div>
            <button
              onClick={() => setTab('code-promo')}
              className="btn-primary"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Entrer mon code →
            </button>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

/* ─── Styles utilitaires ─────────────────────────────── */
const mainStyle: React.CSSProperties = {
  maxWidth: 1000, margin: '0 auto', padding: '48px 20px 80px',
};
const headerStyle: React.CSSProperties = {
  marginBottom: 36,
};
const h2Style: React.CSSProperties = {
  fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 900,
  color: 'var(--navy)', letterSpacing: -0.5, marginBottom: 8,
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 15, color: 'var(--text-mid)',
};
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 20,
};
const noteStyle: React.CSSProperties = {
  marginTop: 24, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
};
