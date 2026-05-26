import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OFFER_LABELS: Record<string, { emoji: string; name: string; next: string }> = {
  boost_annonce:             { emoji: '🚀', name: 'Remonter mon annonce',         next: 'Ton annonce est maintenant en tête des résultats pour 3 jours.' },
  sos_annonce:               { emoji: '⚡', name: 'SOS Annonce',                  next: 'Tous les travailleurs disponibles ont reçu une notification push.' },
  pack_mensuel_particulier:  { emoji: '🎯', name: 'Pack Mensuel Particulier',      next: 'Tu peux maintenant utiliser le SOS Annonce sur toutes tes annonces.' },
  pack_mensuel_pro:          { emoji: '💼', name: 'Pack Mensuel Pro',             next: 'Tu peux maintenant utiliser le SOS Annonce sur toutes tes annonces.' },
  pack_visibilite_travailleur: { emoji: '⭐', name: 'Pack Visibilité Travailleur', next: 'Ton profil est mis en avant et tu recevras une notif 30 min avant chaque annonce.' },
  pack_visibilite_auto:      { emoji: '🧾', name: 'Pack Visibilité Auto-Entrepreneur', next: 'Ton profil est mis en avant — pros et particuliers peuvent te contacter directement.' },
};

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const offer = OFFER_LABELS[params.offer ?? ''] ?? {
    emoji: '✅',
    name: 'Paiement confirmé',
    next: 'Ton offre est maintenant active.',
  };

  return (
    <>
      <Header />

      <main style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: 'white', borderRadius: 24,
          border: '1px solid var(--border)',
          padding: '48px 40px',
          boxShadow: '0 8px 32px rgba(13,31,45,0.08)',
        }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>{offer.emoji}</div>

          <div style={{
            display: 'inline-block',
            background: 'var(--teal-light)', color: 'var(--teal-dark)',
            padding: '6px 16px', borderRadius: 999,
            fontSize: 13, fontWeight: 700, marginBottom: 20,
          }}>
            Paiement confirmé
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--navy)', letterSpacing: -0.5, marginBottom: 12 }}>
            {offer.name} activé !
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: 32 }}>
            {offer.next}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/profil" style={{
              display: 'inline-block',
              background: 'var(--teal)', color: 'var(--navy)',
              padding: '13px 24px', borderRadius: 12,
              fontWeight: 800, fontSize: 14,
            }}>
              Voir mon profil →
            </Link>
            <Link href="/missions" style={{
              display: 'inline-block',
              background: 'var(--cream)', color: 'var(--navy)',
              padding: '13px 24px', borderRadius: 12,
              fontWeight: 700, fontSize: 14,
              border: '1.5px solid var(--border)',
            }}>
              Voir les missions
            </Link>
          </div>

          {params.session_id && (
            <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)' }}>
              Référence : {params.session_id.slice(0, 28)}…
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
