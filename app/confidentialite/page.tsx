import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Politique de confidentialité — Jobici",
  description: "Comment Jobici protège vos données personnelles selon le RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Politique de confidentialité 🔒</h1>
          <p>Comment Jobici protège vos données personnelles conformément au RGPD.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <article style={articleStyle}>

          <p style={updateStyle}>📅 Dernière mise à jour : 18 mai 2026</p>

          <p style={pStyle}>
            La présente politique de confidentialité décrit comment <strong>Jobici</strong> collecte,
            utilise, partage et protège vos données personnelles, en conformité avec le
            <strong> Règlement Général sur la Protection des Données (RGPD)</strong> et la
            <strong> loi Informatique et Libertés</strong>.
          </p>

          <h2 style={h2Style}>1. Responsable du traitement</h2>
          <div style={infoBox}>
            <p><strong>JOBICI</strong> SASU</p>
            <p>Siège social : 1350 Route de Tournon, 07610 Lemps</p>
            <p>SIRET : [En cours d'immatriculation]</p>
            <p>📧 Email : <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></p>
            <p><strong>Délégué à la protection des données (DPO) :</strong> contact@job-ici.com</p>
          </div>

          <h2 style={h2Style}>2. Données collectées</h2>
          <p style={pStyle}>
            Jobici collecte et traite les catégories de données suivantes :
          </p>

          <h3 style={h3Style}>2.1 Données d'identification</h3>
          <ul style={ulStyle}>
            <li>Nom, prénom</li>
            <li>Date de naissance / âge</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale, ville</li>
            <li>Photo de profil (optionnel)</li>
            <li>Carte d'identité (pour vérification)</li>
            <li>Carte vitale (pour mandat CESU)</li>
          </ul>

          <h3 style={h3Style}>2.2 Données pour les mineurs (14-17 ans)</h3>
          <ul style={ulStyle}>
            <li>Nom et prénom du parent ou tuteur légal</li>
            <li>Téléphone du parent</li>
            <li>Email du parent</li>
            <li>Autorisation parentale signée</li>
          </ul>

          <h3 style={h3Style}>2.3 Données pour les professionnels</h3>
          <ul style={ulStyle}>
            <li>Nom de l'entreprise, SIRET, forme juridique</li>
            <li>Adresse du siège social</li>
            <li>Code APE, numéro de TVA intracommunautaire</li>
            <li>Nom et coordonnées du représentant légal</li>
          </ul>

          <h3 style={h3Style}>2.4 Données financières</h3>
          <ul style={ulStyle}>
            <li>IBAN (pour les paiements via Stripe)</li>
            <li>Historique des transactions</li>
            <li>Factures émises</li>
          </ul>
          <p style={pStyle}>
            <strong>⚠️ Important :</strong> Aucune donnée bancaire complète (numéro de carte, CVV) n'est
            stockée par Jobici. Les paiements sont traités directement par Stripe, certifié PCI-DSS niveau 1.
          </p>

          <h3 style={h3Style}>2.5 Données de navigation</h3>
          <ul style={ulStyle}>
            <li>Adresse IP</li>
            <li>Type de navigateur, système d'exploitation</li>
            <li>Pages visitées, durée des visites</li>
            <li>Cookies (voir section 9)</li>
          </ul>

          <h2 style={h2Style}>3. Finalités du traitement</h2>
          <p style={pStyle}>Vos données sont utilisées pour :</p>
          <ul style={ulStyle}>
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Permettre la mise en relation entre travailleurs et employeurs</li>
            <li>Traiter les paiements via Stripe</li>
            <li>Assurer le mandat CESU (déclarations URSSAF)</li>
            <li>Vérifier votre identité et lutter contre la fraude</li>
            <li>Vous envoyer des notifications relatives à votre activité</li>
            <li>Améliorer nos services (analyses statistiques anonymisées)</li>
            <li>Respecter nos obligations légales</li>
          </ul>

          <h2 style={h2Style}>4. Bases légales du traitement</h2>
          <p style={pStyle}>Conformément à l'article 6 du RGPD, nous traitons vos données sur les bases suivantes :</p>
          <ul style={ulStyle}>
            <li><strong>Exécution du contrat</strong> : pour fournir nos services à nos utilisateurs</li>
            <li><strong>Obligation légale</strong> : pour les déclarations URSSAF, fiscales, etc.</li>
            <li><strong>Consentement</strong> : pour les communications marketing</li>
            <li><strong>Intérêt légitime</strong> : pour la sécurité et la lutte contre la fraude</li>
          </ul>

          <h2 style={h2Style}>5. Durée de conservation</h2>
          <ul style={ulStyle}>
            <li><strong>Données du compte actif</strong> : pendant toute la durée d'utilisation du service</li>
            <li><strong>Après suppression du compte</strong> : 3 ans pour des raisons légales et fiscales</li>
            <li><strong>Données financières</strong> : 10 ans (obligations comptables)</li>
            <li><strong>Données de navigation</strong> : 13 mois maximum</li>
            <li><strong>Documents d'identité</strong> : supprimés 3 mois après vérification</li>
          </ul>

          <h2 style={h2Style}>6. Destinataires des données</h2>
          <p style={pStyle}>Vos données peuvent être partagées avec :</p>
          <ul style={ulStyle}>
            <li><strong>Les autres utilisateurs de Jobici</strong> (nom, ville, note, profil public) pour la mise en relation</li>
            <li><strong>Stripe Inc.</strong> pour le traitement des paiements</li>
            <li><strong>Supabase Inc.</strong> pour le stockage sécurisé des données</li>
            <li><strong>L'URSSAF</strong> pour les déclarations CESU (mandat)</li>
            <li><strong>Autorités administratives ou judiciaires</strong> sur demande légale</li>
          </ul>
          <p style={pStyle}>
            <strong>Jobici ne vend jamais vos données personnelles à des tiers</strong>.
          </p>

          <h2 style={h2Style}>7. Transferts hors UE</h2>
          <p style={pStyle}>
            Certains de nos prestataires (Stripe, Vercel) sont basés aux États-Unis. Ces transferts sont
            encadrés par les <strong>clauses contractuelles types</strong> approuvées par la Commission
            européenne et le <strong>Data Privacy Framework</strong>.
          </p>

          <h2 style={h2Style}>8. Vos droits</h2>
          <p style={pStyle}>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={ulStyle}>
            <li>📖 <strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li>✏️ <strong>Droit de rectification</strong> : corriger les données inexactes</li>
            <li>🗑️ <strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
            <li>⏸️ <strong>Droit à la limitation</strong> : restreindre le traitement</li>
            <li>📦 <strong>Droit à la portabilité</strong> : récupérer vos données dans un format ouvert</li>
            <li>🚫 <strong>Droit d'opposition</strong> : refuser le traitement</li>
            <li>📤 <strong>Droit de retirer votre consentement</strong> à tout moment</li>
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits, contactez-nous à
            <a href="mailto:contact@job-ici.com" style={linkStyle}> contact@job-ici.com</a>.
            Une réponse vous sera apportée sous <strong>1 mois maximum</strong>.
          </p>
          <p style={pStyle}>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
            auprès de la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={linkStyle}>cnil.fr</a>.
          </p>

          <h2 style={h2Style}>9. Cookies</h2>
          <p style={pStyle}>
            Jobici utilise des cookies pour améliorer votre expérience. Vous pouvez les accepter ou les
            refuser via le bandeau de consentement.
          </p>
          <h3 style={h3Style}>9.1 Cookies essentiels</h3>
          <p style={pStyle}>
            Nécessaires au fonctionnement du site (session de connexion, panier). Ne nécessitent pas de consentement.
          </p>
          <h3 style={h3Style}>9.2 Cookies de mesure d'audience</h3>
          <p style={pStyle}>
            Permettent d'analyser l'utilisation du site (Google Analytics anonymisé).
          </p>
          <h3 style={h3Style}>9.3 Cookies tiers</h3>
          <p style={pStyle}>
            Aucun cookie publicitaire n'est utilisé sur Jobici.
          </p>

          <h2 style={h2Style}>10. Sécurité des données</h2>
          <p style={pStyle}>Jobici met en œuvre les mesures suivantes :</p>
          <ul style={ulStyle}>
            <li>🔐 Chiffrement HTTPS/TLS de toutes les communications</li>
            <li>🔐 Mots de passe hachés avec bcrypt (jamais stockés en clair)</li>
            <li>🔐 Authentification à deux facteurs disponible</li>
            <li>🔐 Stockage des documents sensibles avec accès restreint (RLS Supabase)</li>
            <li>🔐 Audit régulier de la sécurité</li>
            <li>🔐 Sauvegarde quotidienne des données</li>
          </ul>

          <h2 style={h2Style}>11. Protection des mineurs</h2>
          <p style={pStyle}>
            L'inscription des mineurs (14-17 ans) est soumise à une <strong>autorisation parentale signée</strong>.
            Les missions confiées aux mineurs sont strictement encadrées par le Code du travail
            (durée, types de tâches, horaires).
          </p>
          <p style={pStyle}>
            Aucun mineur de moins de 14 ans ne peut s'inscrire sur Jobici.
          </p>

          <h2 style={h2Style}>12. Modifications de la politique</h2>
          <p style={pStyle}>
            Jobici se réserve le droit de modifier cette politique. Les utilisateurs seront informés par
            email ou notification dans l'application en cas de changement substantiel.
          </p>

          <h2 style={h2Style}>13. Contact</h2>
          <p style={pStyle}>
            Pour toute question relative à la protection de vos données :
          </p>
          <div style={infoBox}>
            <p>📧 <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></p>
            <p>Réponse sous 1 mois maximum, conformément au RGPD.</p>
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