import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Mentions légales — Jobici",
  description: "Mentions légales et informations légales de Jobici.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Mentions légales ⚖️</h1>
          <p>Informations légales relatives au site et à l'éditeur de Jobici.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <article style={articleStyle}>

          <p style={updateStyle}>
            📅 Dernière mise à jour : 1er juin 2026
          </p>

          <h2 style={h2Style}>1. Éditeur du site</h2>
          <div style={infoBox}>
            <p><strong>Raison sociale :</strong> JOBICI SASU</p>
            <p><strong>Capital social :</strong> 1 000 €</p>
            <p><strong>Numéro SIRET :</strong> 105 264 220 00010</p>
            <p><strong>Numéro SIREN :</strong> 105 264 220</p>
            <p><strong>Numéro TVA intracommunautaire :</strong> FR54105264220</p>
            <p><strong>Siège social :</strong> 1350 Route de Tournon, 07610 Lemps</p>
            <p><strong>Téléphone :</strong> 06 79 46 81 16</p>
            <p><strong>Email :</strong> <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></p>
            <p><strong>Site web :</strong> <a href="https://job-ici.com" style={linkStyle}>https://job-ici.com</a></p>
          </div>

          <h2 style={h2Style}>2. Directeur de la publication</h2>
          <p style={pStyle}>
            <strong>Dylan Redon</strong>, en qualité de Président, est responsable de la publication
            du site web et de l'application mobile Jobici. Il peut être contacté à l'adresse
            email : <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a>.
          </p>

          <h2 style={h2Style}>3. Hébergeur du site</h2>
          <div style={infoBox}>
            <p><strong>Vercel Inc.</strong></p>
            <p>340 S Lemon Ave #4133</p>
            <p>Walnut, CA 91789</p>
            <p>États-Unis</p>
            <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>vercel.com</a></p>
          </div>

          <h2 style={h2Style}>4. Stockage et traitement des données</h2>
          <p style={pStyle}>
            Les données de Jobici sont stockées sur la plateforme <strong>Supabase</strong> :
          </p>
          <div style={infoBox}>
            <p><strong>Supabase Inc.</strong></p>
            <p>970 Toa Payoh North #07-04</p>
            <p>Singapore 318992</p>
            <p>Région de stockage : Union européenne (Francfort, Allemagne)</p>
            <p><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>supabase.com</a></p>
          </div>

          <h2 style={h2Style}>5. Propriété intellectuelle</h2>
          <p style={pStyle}>
            L'ensemble du contenu du site Jobici (textes, images, logos, vidéos, code source, design)
            est protégé par le droit d'auteur et reste la propriété exclusive de Jobici, sauf mention contraire.
          </p>
          <p style={pStyle}>
            Toute reproduction, représentation, modification, publication, adaptation totale ou partielle
            des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans
            autorisation écrite préalable.
          </p>
          <p style={pStyle}>
            La marque <strong>Jobici</strong> et son logo sont des marques déposées
            [Dépôt INPI à venir]. Toute reproduction non autorisée constitue une contrefaçon
            sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>

          <h2 style={h2Style}>6. Limitation de responsabilité</h2>
          <p style={pStyle}>
            Jobici s'efforce de fournir des informations exactes et à jour sur son site et son application.
            Cependant, Jobici ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations
            mises à disposition.
          </p>
          <p style={pStyle}>
            Jobici ne saurait être tenu responsable des dommages directs ou indirects résultant de
            l'utilisation du site, notamment en cas d'interruption, de bug, ou de perte de données.
          </p>

          <h2 style={h2Style}>7. Médiation de la consommation</h2>
          <p style={pStyle}>
            Conformément aux articles L.611-1 et suivants du Code de la consommation, tout litige avec
            un consommateur peut être soumis à un médiateur de la consommation. Jobici propose à ses
            utilisateurs le médiateur suivant :
          </p>
          <div style={infoBox}>
            <p><strong>CM2C — Centre de Médiation de Consommation des Conciliateurs de Justice</strong></p>
            <p>14 rue Saint-Jean</p>
            <p>75017 Paris</p>
            <p><strong>Site web :</strong> <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer" style={linkStyle}>cm2c.net</a></p>
          </div>

          <h2 style={h2Style}>8. Droit applicable et juridiction</h2>
          <p style={pStyle}>
            Les présentes mentions légales sont régies par le droit français. En cas de litige et à
            défaut d'accord amiable, le différend sera porté devant les tribunaux français compétents.
          </p>

          <h2 style={h2Style}>9. Contact</h2>
          <p style={pStyle}>
            Pour toute question relative aux présentes mentions légales :
          </p>
          <div style={infoBox}>
            <p>📧 <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></p>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

const articleStyle: React.CSSProperties = {
  background: 'white', padding: 40, borderRadius: 20,
  border: '1px solid var(--border)',
};
const updateStyle: React.CSSProperties = {
  background: 'var(--teal-light)', color: 'var(--teal-dark)',
  padding: '10px 16px', borderRadius: 10, display: 'inline-block',
  fontSize: 13, fontWeight: 700, marginBottom: 32,
};
const h2Style: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, color: 'var(--navy)',
  marginTop: 36, marginBottom: 16, letterSpacing: -0.3,
};
const pStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)',
  marginBottom: 14,
};
const infoBox: React.CSSProperties = {
  background: 'var(--cream)', padding: '20px 24px', borderRadius: 12,
  marginTop: 12, marginBottom: 16, border: '1px solid var(--border)',
};
const linkStyle: React.CSSProperties = {
  color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline',
};