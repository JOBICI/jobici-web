import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Conditions Générales d'Utilisation — Jobici",
  description: "CGU de la plateforme Jobici.",
};

export default function CGUPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Conditions générales d'utilisation 📋</h1>
          <p>Les règles qui régissent l'utilisation de Jobici.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <article style={articleStyle}>
          <p style={updateStyle}>📅 Dernière mise à jour : 18 mai 2026</p>

          <h2 style={h2Style}>Préambule</h2>
          <p style={pStyle}>
            Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et
            l'utilisation de la plateforme Jobici, accessible via le site web <strong>job-ici.com</strong>
            et l'application mobile Jobici.
          </p>
          <p style={pStyle}>
            L'utilisateur (ci-après « l'Utilisateur ») reconnaît avoir pris connaissance et accepté
            sans réserve les présentes CGU au moment de son inscription.
          </p>

          <h2 style={h2Style}>Article 1 — Définitions</h2>
          <ul style={ulStyle}>
            <li><strong>Jobici</strong> : la plateforme éditée par JOBICI SASU, permettant la mise en relation entre travailleurs et employeurs pour des missions de proximité.</li>
            <li><strong>Travailleur</strong> : personne physique majeure ou mineure (avec autorisation parentale) cherchant à effectuer des missions rémunérées.</li>
            <li><strong>Auto-entrepreneur</strong> : travailleur indépendant immatriculé proposant ses services.</li>
            <li><strong>Particulier</strong> : personne physique cherchant à embaucher un travailleur pour des tâches du quotidien.</li>
            <li><strong>Professionnel</strong> : personne morale immatriculée (entreprise) cherchant à recruter du personnel.</li>
            <li><strong>Mission</strong> : annonce publiée sur Jobici décrivant un besoin précis.</li>
          </ul>

          <h2 style={h2Style}>Article 2 — Objet</h2>
          <p style={pStyle}>
            Jobici est un service de mise en relation entre :
          </p>
          <ul style={ulStyle}>
            <li>Des Particuliers et Professionnels cherchant à recruter de la main-d'œuvre temporaire ou permanente</li>
            <li>Des Travailleurs (étudiants, salariés, auto-entrepreneurs) cherchant des missions rémunérées</li>
          </ul>
          <p style={pStyle}>
            <strong>Jobici n'est pas une agence d'intérim</strong>. Jobici agit en qualité d'intermédiaire
            technique, sauf dans le cadre du mandat CESU pour les missions chez les particuliers.
          </p>

          <h2 style={h2Style}>Article 3 — Inscription</h2>
          <h3 style={h3Style}>3.1 Conditions d'inscription</h3>
          <p style={pStyle}>L'inscription sur Jobici est ouverte :</p>
          <ul style={ulStyle}>
            <li>Aux personnes physiques majeures (18 ans ou plus)</li>
            <li>Aux mineurs de 14 à 17 ans <strong>avec autorisation parentale écrite</strong></li>
            <li>Aux personnes morales immatriculées au RCS</li>
          </ul>
          <p style={pStyle}>
            <strong>L'inscription des mineurs de moins de 14 ans est strictement interdite</strong>,
            conformément au Code du travail (article L. 4153-1).
          </p>

          <h3 style={h3Style}>3.2 Informations requises</h3>
          <p style={pStyle}>L'Utilisateur s'engage à fournir des informations exactes et à les mettre à jour.</p>

          <h3 style={h3Style}>3.3 Vérification</h3>
          <p style={pStyle}>
            Jobici se réserve le droit de vérifier l'identité des Utilisateurs (pièce d'identité, SIRET, etc.)
            avant l'activation du compte. Les Travailleurs doivent fournir une carte d'identité et une carte
            vitale pour pouvoir postuler aux missions.
          </p>

          <h2 style={h2Style}>Article 4 — Comportements interdits</h2>
          <p style={pStyle}>Il est strictement interdit aux Utilisateurs de :</p>
          <ul style={ulStyle}>
            <li>Publier des missions contraires à la loi</li>
            <li>Diffuser des contenus haineux, discriminatoires, violents ou pornographiques</li>
            <li>Usurper l'identité d'un tiers</li>
            <li>Contourner les paiements via la plateforme</li>
            <li>Recopier ou diffuser le contenu de Jobici sans autorisation</li>
            <li>Utiliser des moyens automatisés (bots) pour interagir avec la plateforme</li>
            <li>Spammer ou démarcher commercialement les autres utilisateurs</li>
          </ul>

          <h2 style={h2Style}>Article 5 — Tarification</h2>
          <p style={pStyle}>L'inscription et l'utilisation de Jobici sont gratuites. Des commissions sont prélevées sur les missions réalisées :</p>
          <ul style={ulStyle}>
            <li><strong>0%</strong> pour les Travailleurs</li>
            <li><strong>15%</strong> sur le tarif pour les Particuliers (mandat CESU)</li>
            <li><strong>20% HT</strong> sur le tarif pour les Professionnels</li>
          </ul>
          <p style={pStyle}>
            Un abonnement optionnel <strong>SOS Urgence Pro</strong> à 9,99 €/mois est disponible pour
            les Professionnels souhaitant mettre en avant leurs annonces urgentes.
          </p>

          <h2 style={h2Style}>Article 6 — Paiements</h2>
          <p style={pStyle}>
            Les paiements sont sécurisés et traités par <strong>Stripe Connect</strong>, prestataire
            agréé par la Banque Centrale Irlandaise. Aucune donnée bancaire complète n'est stockée par Jobici.
          </p>
          <p style={pStyle}>
            Le montant est bloqué dès l'acceptation de la mission et libéré au Travailleur sous
            <strong> 48 heures</strong> après validation par l'employeur.
          </p>

          <h2 style={h2Style}>Article 7 — Mandat CESU</h2>
          <p style={pStyle}>
            Pour les missions confiées par un Particulier, Jobici agit en qualité de <strong>mandataire
            CESU</strong> et prend en charge :
          </p>
          <ul style={ulStyle}>
            <li>La déclaration préalable à l'embauche (DPAE)</li>
            <li>La rédaction du contrat de travail</li>
            <li>Le calcul et le versement des cotisations URSSAF</li>
            <li>L'émission des bulletins de paie</li>
          </ul>
          <p style={pStyle}>
            Le particulier reste l'<strong>employeur légal</strong> du travailleur. Jobici n'a pas de
            lien contractuel direct avec le travailleur dans ce cas.
          </p>

          <h2 style={h2Style}>Article 8 — Mineurs</h2>
          <p style={pStyle}>L'inscription des Mineurs (14-17 ans) est soumise à :</p>
          <ul style={ulStyle}>
            <li>Une autorisation parentale écrite et signée</li>
            <li>Une durée de travail limitée selon le Code du travail (max 7h/jour pour les 14-15 ans, 8h/jour pour les 16-17 ans)</li>
            <li>Une rémunération minimum respectant le SMIC mineur (-20% pour les moins de 17 ans, -10% pour les 17 ans)</li>
            <li>Une interdiction des travaux dangereux ou nocturnes (22h-6h)</li>
          </ul>

          <h2 style={h2Style}>Article 9 — Notation et avis</h2>
          <p style={pStyle}>
            Les Utilisateurs peuvent se noter mutuellement (de 1 à 5 étoiles) après chaque mission.
            Les avis sont publics et ne peuvent être supprimés que dans les cas suivants :
          </p>
          <ul style={ulStyle}>
            <li>Contenu injurieux ou diffamatoire</li>
            <li>Données personnelles divulguées</li>
            <li>Conflit d'intérêts manifeste</li>
          </ul>

          <h2 style={h2Style}>Article 10 — Responsabilité</h2>
          <p style={pStyle}>
            Jobici met tout en œuvre pour assurer la qualité de son service mais ne saurait être tenue
            responsable :
          </p>
          <ul style={ulStyle}>
            <li>Des comportements des Utilisateurs entre eux</li>
            <li>De la qualité des prestations réalisées</li>
            <li>Des litiges contractuels entre employeur et travailleur (hors mandat CESU)</li>
            <li>Des interruptions ou bugs techniques</li>
          </ul>

          <h2 style={h2Style}>Article 11 — Suspension et résiliation</h2>
          <p style={pStyle}>
            Jobici peut suspendre ou résilier le compte d'un Utilisateur en cas de :
          </p>
          <ul style={ulStyle}>
            <li>Non-respect des présentes CGU</li>
            <li>Comportement frauduleux ou abusif</li>
            <li>Plaintes répétées d'autres Utilisateurs</li>
            <li>Inactivité prolongée (plus de 2 ans)</li>
          </ul>
          <p style={pStyle}>
            L'Utilisateur peut supprimer son compte à tout moment depuis son profil ou en contactant
            <a href="mailto:contact@job-ici.com" style={linkStyle}> contact@job-ici.com</a>.
          </p>

          <h2 style={h2Style}>Article 12 — Données personnelles</h2>
          <p style={pStyle}>
            Le traitement des données personnelles est régi par notre
            <a href="/confidentialite" style={linkStyle}> Politique de confidentialité</a>, conforme au RGPD.
          </p>

          <h2 style={h2Style}>Article 13 — Propriété intellectuelle</h2>
          <p style={pStyle}>
            Tous les contenus de Jobici (textes, images, code, design, marque) sont protégés. Toute
            reproduction non autorisée est interdite.
          </p>

          <h2 style={h2Style}>Article 14 — Modification des CGU</h2>
          <p style={pStyle}>
            Jobici se réserve le droit de modifier les CGU à tout moment. Les Utilisateurs seront
            informés par email ou notification. La poursuite de l'utilisation après modification
            vaut acceptation.
          </p>

          <h2 style={h2Style}>Article 15 — Litiges</h2>
          <p style={pStyle}>
            En cas de litige, les Utilisateurs sont invités à contacter Jobici à
            <a href="mailto:contact@job-ici.com" style={linkStyle}> contact@job-ici.com</a> pour une
            résolution amiable.
          </p>
          <p style={pStyle}>
            À défaut, le médiateur de la consommation <strong>CM2C</strong> peut être saisi
            (<a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" style={linkStyle}>cm2c.net</a>).
          </p>
          <p style={pStyle}>
            En dernier recours, les tribunaux français compétents seront saisis.
          </p>

          <h2 style={h2Style}>Article 16 — Loi applicable</h2>
          <p style={pStyle}>
            Les présentes CGU sont régies par le <strong>droit français</strong>.
          </p>

          <div style={{ ...infoBox, marginTop: 40, textAlign: 'center' }}>
            <p style={{ marginBottom: 8, fontWeight: 700, color: 'var(--navy)' }}>📧 Contact</p>
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
const infoBox: React.CSSProperties = { background: 'var(--cream)', padding: '20px 24px', borderRadius: 12, marginTop: 12, marginBottom: 16, border: '1px solid var(--border)' };
const linkStyle: React.CSSProperties = { color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline' };