import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Conditions Générales de Vente — Jobici",
  description: "CGV de la plateforme Jobici.",
};

export default function CGVPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Conditions générales de vente 💼</h1>
          <p>Les règles relatives à la facturation et aux paiements sur Jobici.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <article style={articleStyle}>
          <p style={updateStyle}>📅 Dernière mise à jour : 18 mai 2026</p>

          <h2 style={h2Style}>Article 1 — Objet</h2>
          <p style={pStyle}>
            Les présentes Conditions Générales de Vente (ci-après « CGV ») définissent les conditions
            financières applicables aux services proposés par Jobici à ses Utilisateurs.
          </p>

          <h2 style={h2Style}>Article 2 — Tarification</h2>

          <h3 style={h3Style}>2.1 Pour les Travailleurs</h3>
          <p style={pStyle}>
            <strong>L'inscription et l'utilisation de Jobici sont totalement gratuites pour les
            Travailleurs.</strong> Aucune commission n'est prélevée sur leurs gains, conformément au
            Code du travail (article L. 1132-1).
          </p>

          <h3 style={h3Style}>2.2 Pour les Particuliers</h3>
          <p style={pStyle}>
            Une commission de <strong>15 % TTC</strong> est appliquée sur chaque mission réalisée
            via la plateforme. Cette commission rémunère le service de mise en relation et le mandat CESU.
          </p>
          <p style={pStyle}>
            <strong>Avantage fiscal :</strong> les particuliers bénéficient de
            <strong> 50 % de crédit d'impôt</strong> sur les sommes versées au titre des Services à la
            Personne (article 199 sexdecies du CGI).
          </p>

          <h3 style={h3Style}>2.3 Pour les Professionnels</h3>
          <p style={pStyle}>
            Une commission de <strong>20 % HT</strong> (24 % TTC) est appliquée sur chaque mission
            réalisée via la plateforme. Une facture détaillée est émise automatiquement.
          </p>

          <h3 style={h3Style}>2.4 Abonnement SOS Urgence Pro</h3>
          <p style={pStyle}>
            Service optionnel à <strong>9,99 € HT/mois</strong> (11,99 € TTC) pour les Professionnels
            souhaitant mettre en avant leurs annonces urgentes. Sans engagement de durée, résiliable
            à tout moment.
          </p>

          <h2 style={h2Style}>Article 3 — Modalités de paiement</h2>
          <p style={pStyle}>
            Les paiements sont traités par <strong>Stripe Connect</strong>, prestataire de services de
            paiement agréé par la Banque Centrale Irlandaise.
          </p>
          <p style={pStyle}>Modes de paiement acceptés :</p>
          <ul style={ulStyle}>
            <li>Carte bancaire (Visa, Mastercard, American Express)</li>
            <li>Virement bancaire SEPA</li>
            <li>Apple Pay et Google Pay</li>
          </ul>
          <p style={pStyle}>
            <strong>Aucune donnée bancaire complète n'est stockée par Jobici.</strong> Les informations
            de paiement sont sécurisées directement par Stripe (certifié PCI-DSS niveau 1).
          </p>

          <h2 style={h2Style}>Article 4 — Processus de paiement d'une mission</h2>
          <ol style={olStyle}>
            <li><strong>Acceptation de la mission</strong> : le montant total est bloqué sur le compte de l'employeur via Stripe</li>
            <li><strong>Réalisation de la mission</strong> par le travailleur</li>
            <li><strong>Validation de la mission</strong> par l'employeur (sous 48h après la fin de la mission)</li>
            <li><strong>Versement au travailleur</strong> : sous 48h après validation, déduction faite de la commission Jobici</li>
            <li><strong>Émission des factures et bulletins de paie</strong> : automatique</li>
          </ol>

          <h2 style={h2Style}>Article 5 — Annulation et remboursement</h2>

          <h3 style={h3Style}>5.1 Annulation par l'employeur</h3>
          <ul style={ulStyle}>
            <li><strong>Plus de 24h avant la mission</strong> : remboursement intégral, aucun frais</li>
            <li><strong>Moins de 24h avant la mission</strong> : 50 % du montant retenu à titre d'indemnité pour le travailleur</li>
            <li><strong>Le jour même</strong> : 100 % du montant dû au travailleur (sauf cas de force majeure justifié)</li>
          </ul>

          <h3 style={h3Style}>5.2 Annulation par le travailleur</h3>
          <ul style={ulStyle}>
            <li><strong>Plus de 24h avant la mission</strong> : aucune pénalité</li>
            <li><strong>Moins de 24h avant la mission</strong> : un avertissement est appliqué sur le profil</li>
            <li><strong>Le jour même (no-show)</strong> : pénalité financière et possible suspension du compte</li>
          </ul>

          <h3 style={h3Style}>5.3 Litige sur la qualité de la mission</h3>
          <p style={pStyle}>
            En cas de désaccord, l'employeur peut signaler un problème dans les 48h après la mission.
            Jobici procède à une médiation et peut ordonner :
          </p>
          <ul style={ulStyle}>
            <li>Un remboursement total ou partiel</li>
            <li>Une refacturation</li>
            <li>Une suspension du compte du contrevenant</li>
          </ul>

          <h2 style={h2Style}>Article 6 — Facturation</h2>
          <p style={pStyle}>
            Une facture conforme aux exigences légales est émise automatiquement par Jobici après
            chaque mission validée. Elle est disponible dans l'espace personnel de l'Utilisateur et
            envoyée par email.
          </p>
          <p style={pStyle}>
            <strong>Mentions obligatoires</strong> sur chaque facture :
          </p>
          <ul style={ulStyle}>
            <li>Date de la facture et numéro unique</li>
            <li>Coordonnées complètes de Jobici (SIRET, TVA)</li>
            <li>Coordonnées du client</li>
            <li>Détail de la prestation (mission, durée, tarif)</li>
            <li>Montant HT, TVA, TTC</li>
          </ul>

          <h2 style={h2Style}>Article 7 — TVA</h2>
          <p style={pStyle}>
            Jobici applique la <strong>TVA à 20 %</strong> sur les commissions facturées aux Professionnels.
          </p>
          <p style={pStyle}>
            Pour les Particuliers, les commissions sont TTC (TVA incluse à 20 %).
          </p>

          <h2 style={h2Style}>Article 8 — Droit de rétractation</h2>
          <p style={pStyle}>
            Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation
            de 14 jours <strong>ne s'applique pas</strong> aux prestations de services pleinement
            exécutées avant la fin du délai de rétractation, avec accord exprès du consommateur.
          </p>
          <p style={pStyle}>
            Pour l'abonnement <strong>SOS Urgence Pro</strong>, le droit de rétractation s'applique
            dans les 14 jours suivant la souscription, sauf début d'exécution du service avec accord
            exprès du Professionnel.
          </p>

          <h2 style={h2Style}>Article 9 — Garanties et responsabilité</h2>
          <p style={pStyle}>
            Jobici garantit la disponibilité du service 24/7, hors maintenance programmée. Une
            disponibilité moyenne de <strong>99,5 %</strong> est visée.
          </p>
          <p style={pStyle}>
            Jobici ne saurait être tenue responsable des dommages indirects résultant de l'utilisation
            de la plateforme.
          </p>

          <h2 style={h2Style}>Article 10 — Litiges</h2>
          <p style={pStyle}>
            En cas de litige financier, l'Utilisateur peut :
          </p>
          <ol style={olStyle}>
            <li>Contacter le service client : <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></li>
            <li>Saisir le médiateur de la consommation : <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" style={linkStyle}>CM2C</a></li>
            <li>Saisir les tribunaux français compétents</li>
          </ol>

          <h2 style={h2Style}>Article 11 — Modification des CGV</h2>
          <p style={pStyle}>
            Jobici se réserve le droit de modifier les CGV. Les Utilisateurs sont informés par email
            au moins 30 jours avant l'entrée en vigueur des nouvelles conditions.
          </p>

          <h2 style={h2Style}>Article 12 — Loi applicable</h2>
          <p style={pStyle}>
            Les présentes CGV sont régies par le <strong>droit français</strong>. Tout litige sera
            soumis aux tribunaux français compétents.
          </p>

          <div style={{ ...infoBox, marginTop: 40, textAlign: 'center' }}>
            <p style={{ marginBottom: 8, fontWeight: 700, color: 'var(--navy)' }}>📧 Contact pour facturation</p>
            <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

const articleStyle: React.CSSProperties = { background: 'white', padding: 40, borderRadius: 20, border: '1px solid var(--border)' };
const updateStyle: React.CSSProperties = { background: 'var(--teal-light)', color: 'var(--teal-dark)', padding: '10px 16px', borderRadius: 10, display: 'inline-block', fontSize: 13, fontWeight: 700, marginBottom: 32 };
const h2Style: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 36, marginBottom: 16, letterSpacing: -0.3 };
const h3Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginTop: 20, marginBottom: 8 };
const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)', marginBottom: 14 };
const ulStyle: React.CSSProperties = { paddingLeft: 24, fontSize: 15, lineHeight: 1.8, color: 'var(--text-dark)', marginBottom: 14 };
const olStyle: React.CSSProperties = { paddingLeft: 24, fontSize: 15, lineHeight: 1.8, color: 'var(--text-dark)', marginBottom: 14 };
const infoBox: React.CSSProperties = { background: 'var(--cream)', padding: '20px 24px', borderRadius: 12, marginTop: 12, marginBottom: 16, border: '1px solid var(--border)' };
const linkStyle: React.CSSProperties = { color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline' };