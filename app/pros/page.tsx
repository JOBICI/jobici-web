import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = { title: "Pour les Pros — Jobici" };

export default function ProsPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Trouvez vos travailleurs <span className="teal-text">en quelques minutes</span> 💼</h1>
          <p>Restaurant, boutique, artisan, salon de coiffure… Jobici simplifie le recrutement de personnel pour vos missions ponctuelles ou récurrentes.</p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <Link href="/publier-mission" className="btn-primary" style={{ padding: '16px 28px', fontSize: 14 }}>
              📋 Publier une mission
            </Link>
            <Link href="/inscription?type=pro" style={{ padding: '16px 28px', borderRadius: 12, background: 'white', color: 'var(--navy)', border: '1.5px solid var(--border)', fontWeight: 800, fontSize: 14 }}>
              S'inscrire en tant que Professionnelle
            </Link>
          </div>
        </div>
      </section>

      <section className="page-content">
        <div className="content-grid">
          <div className="content-text">
            <h2>Publiez votre mission, choisissez votre candidat 🎯</h2>
            <p>Pas besoin de passer par une agence d'intérim ou de gérer des dizaines de CV. En 2 minutes, votre annonce est en ligne et visible par les travailleurs qualifiés près de chez vous.</p>
            <ul>
              <li>Publication en 2 minutes, sans paperasse</li>
              <li>Travailleurs vérifiés (identité + références)</li>
              <li>Système de notation transparent</li>
              <li>Vous choisissez qui répond à votre annonce</li>
            </ul>
          </div>
          <div className="content-visual dark">
            <span className="big-emoji">📋</span>
            <h3>Publication simple</h3>
            <p>Décrivez votre mission, fixez le tarif, c'est en ligne.</p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 80 }}>
          <div className="content-visual">
            <span className="big-emoji">💳</span>
            <h3>100% sécurisé</h3>
            <p>Votre paiement est protégé du début à la fin.</p>
          </div>
          <div className="content-text">
            <h2>Paiement sécurisé via Stripe 🔒</h2>
            <p>Le montant est bloqué automatiquement à l'acceptation de la mission. Une fois validée, il est libéré au travailleur sous 48h.</p>
            <ul>
              <li>Aucune carte stockée par Jobici</li>
              <li>Stripe Connect (agréé Banque Centrale Irlande)</li>
              <li>Facture automatique à chaque mission</li>
              <li>Conforme RGPD</li>
            </ul>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 80 }}>
          <div className="content-text">
            <h2>SOS Urgence Professionnelle ⚡</h2>
            <p>Un serveur qui n'arrive pas ? Une vente massive imprévue ? L'abonnement SOS Urgence vous garantit une mise en avant prioritaire.</p>
            <ul>
              <li>Vos annonces apparaissent en premier</li>
              <li>Notification immédiate aux travailleurs disponibles</li>
              <li>9,99 €/mois sans engagement</li>
              <li>Résiliable à tout moment</li>
            </ul>
          </div>
          <div className="content-visual dark">
            <span className="big-emoji">⚡</span>
            <h3>SOS Urgence</h3>
            <p>Pour les situations qui ne peuvent pas attendre.</p>
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '80px 0' }}>
        <div className="container">
          <h2 className="section-title">Tarifs transparents</h2>
          <p className="section-subtitle">Pas de frais cachés, pas d'engagement.</p>

          <div className="features-grid" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="feature-card" style={{ textAlign: 'left', padding: 32 }}>
              <span className="feature-emoji">💼</span>
              <h3 style={{ fontSize: 24, marginBottom: 16 }}>Commission mission</h3>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--teal)', marginBottom: 12 }}>20% HT</p>
              <p>Sur chaque mission réalisée via la plateforme. Pas de coût fixe, vous ne payez que ce que vous utilisez.</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'left', padding: 32 }}>
              <span className="feature-emoji">⚡</span>
              <h3 style={{ fontSize: 24, marginBottom: 16 }}>SOS Urgence Professionnelle</h3>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--teal)', marginBottom: 12 }}>9,99 €/mois</p>
              <p>Abonnement optionnel pour les missions urgentes. Sans engagement, résiliable à tout moment.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="missions-section" style={{ paddingTop: 60 }}>
        <div className="cta-box">
          <span className="cta-emoji">💼</span>
          <div className="cta-text">
            <h3>Prêt à recruter votre premier travailleur ?</h3>
            <p>Publiez votre première mission dès maintenant ou téléchargez l'application Jobici.</p>
          </div>
          <Link href="/publier-mission" className="btn-primary">Publier une mission →</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
