import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: "Politique de cookies — Jobici",
  description: "Comment Jobici utilise les cookies et comment gérer vos préférences.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Politique de cookies 🍪</h1>
          <p>Comment Jobici utilise les cookies et comment gérer vos préférences.</p>
        </div>
      </section>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <article style={articleStyle}>

          <p style={updateStyle}>
            📅 Dernière mise à jour : 26 mai 2026
          </p>

          <h2 style={h2Style}>1. Qu'est-ce qu'un cookie ?</h2>
          <p style={pStyle}>
            Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone ou tablette)
            lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et
            préférences pendant une durée déterminée, afin que vous n'ayez pas à les resaisir à chaque visite.
          </p>

          <h2 style={h2Style}>2. Qui dépose des cookies ?</h2>
          <p style={pStyle}>
            Les cookies présents sur Jobici sont déposés par :
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Jobici (cookies propriétaires)</strong> — pour le bon fonctionnement du service et l'analyse d'utilisation.</li>
            <li style={liStyle}><strong>Supabase</strong> — pour la gestion de l'authentification et des sessions utilisateurs.</li>
          </ul>

          <h2 style={h2Style}>3. Les cookies que nous utilisons</h2>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Durée</th>
                  <th style={thStyle}>Finalité</th>
                </tr>
              </thead>
              <tbody>
                <tr style={trStyle}>
                  <td style={tdStyle}><code style={codeStyle}>jobici_cookies_consent</code></td>
                  <td style={tdStyle}>Essentiel</td>
                  <td style={tdStyle}>1 an</td>
                  <td style={tdStyle}>Mémorise vos préférences de consentement aux cookies.</td>
                </tr>
                <tr style={trStyle}>
                  <td style={tdStyle}><code style={codeStyle}>sb-*</code> (Supabase)</td>
                  <td style={tdStyle}>Essentiel</td>
                  <td style={tdStyle}>Session / 1 an</td>
                  <td style={tdStyle}>Gestion de l'authentification et maintien de votre session de connexion.</td>
                </tr>
                <tr style={trStyle}>
                  <td style={tdStyle}><code style={codeStyle}>_jobici_analytics</code></td>
                  <td style={tdStyle}>Analytique</td>
                  <td style={tdStyle}>13 mois</td>
                  <td style={tdStyle}>Analyse du trafic et du comportement sur le site (données anonymisées). Déposé uniquement avec votre accord.</td>
                </tr>
                <tr style={trStyle}>
                  <td style={tdStyle}><code style={codeStyle}>_jobici_mkt</code></td>
                  <td style={tdStyle}>Marketing</td>
                  <td style={tdStyle}>13 mois</td>
                  <td style={tdStyle}>Personnalisation publicitaire. <strong>Actuellement non utilisé.</strong> Déposé uniquement avec votre accord.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 style={h2Style}>4. Cookies essentiels</h2>
          <p style={pStyle}>
            Les cookies essentiels sont indispensables au fonctionnement du site. Ils permettent notamment :
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>De maintenir votre session de connexion active.</li>
            <li style={liStyle}>De mémoriser vos préférences de consentement.</li>
            <li style={liStyle}>De sécuriser votre navigation.</li>
          </ul>
          <div style={infoBox}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              🔒 Ces cookies <strong>ne peuvent pas être désactivés</strong> car ils sont nécessaires
              au bon fonctionnement du service. Ils ne collectent aucune information permettant de vous
              identifier à des fins publicitaires.
            </p>
          </div>

          <h2 style={h2Style}>5. Cookies analytiques</h2>
          <p style={pStyle}>
            Les cookies analytiques nous aident à comprendre comment les visiteurs interagissent avec
            Jobici : quelles pages sont les plus visitées, d'où viennent les utilisateurs, etc.
            Ces données sont <strong>anonymisées</strong> et ne permettent pas de vous identifier
            personnellement.
          </p>
          <p style={pStyle}>
            Ces cookies sont déposés <strong>uniquement si vous y consentez</strong>.
          </p>

          <h2 style={h2Style}>6. Cookies marketing</h2>
          <p style={pStyle}>
            Les cookies marketing permettent d'afficher des publicités personnalisées en fonction de
            votre profil et de vos centres d'intérêt.
          </p>
          <div style={infoBox}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              ℹ️ <strong>Jobici n'utilise actuellement aucun cookie marketing.</strong> Cette catégorie
              est prévue pour une utilisation future et ne sera activée qu'avec votre consentement explicite.
            </p>
          </div>

          <h2 style={h2Style}>7. Comment gérer vos préférences ?</h2>
          <p style={pStyle}>
            Vous pouvez à tout moment modifier vos choix concernant les cookies. Plusieurs options s'offrent à vous :
          </p>

          <div style={methodBoxStyle}>
            <h3 style={h3Style}>Via notre outil de gestion des cookies</h3>
            <p style={pStyle}>
              Cliquez sur le bouton ci-dessous pour rouvrir la bannière de gestion des cookies et modifier
              vos préférences :
            </p>
            <Link
              href="/?cookies=manage"
              style={btnStyle}
            >
              ⚙️ Gérer mes cookies
            </Link>
          </div>

          <div style={methodBoxStyle}>
            <h3 style={h3Style}>Via les paramètres de votre navigateur</h3>
            <p style={pStyle}>
              Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies, ou pour
              être averti avant qu'un cookie soit déposé. Chaque navigateur dispose d'un menu dédié :
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies</li>
              <li style={liStyle}><strong>Firefox</strong> : Paramètres → Vie privée et sécurité → Cookies</li>
              <li style={liStyle}><strong>Safari</strong> : Préférences → Confidentialité → Cookies</li>
              <li style={liStyle}><strong>Edge</strong> : Paramètres → Confidentialité, recherche et services → Cookies</li>
            </ul>
            <p style={{ ...pStyle, color: 'var(--text-mid)' }}>
              ⚠️ La désactivation de certains cookies peut nuire au bon fonctionnement du service Jobici.
            </p>
          </div>

          <h2 style={h2Style}>8. Durée de conservation du consentement</h2>
          <p style={pStyle}>
            Votre choix de consentement est conservé pendant <strong>12 mois</strong> à compter de
            votre dernière décision. Passé ce délai, nous vous demanderons à nouveau votre accord.
          </p>

          <h2 style={h2Style}>9. Lien avec notre politique de confidentialité</h2>
          <p style={pStyle}>
            La présente politique de cookies est complémentaire à notre{' '}
            <Link href="/confidentialite" style={linkStyle}>politique de confidentialité</Link>.
            Nous vous invitons à la consulter pour comprendre comment Jobici traite vos données
            personnelles dans leur ensemble.
          </p>

          <h2 style={h2Style}>10. Modifications de cette politique</h2>
          <p style={pStyle}>
            Jobici se réserve le droit de modifier la présente politique de cookies à tout moment,
            notamment pour s'adapter aux évolutions légales ou techniques. La date de dernière mise à
            jour est indiquée en haut de cette page. En cas de modification substantielle, nous vous
            en informerons via une nouvelle bannière de consentement.
          </p>

          <h2 style={h2Style}>11. Contact</h2>
          <p style={pStyle}>
            Pour toute question relative à l'utilisation des cookies sur Jobici :
          </p>
          <div style={infoBox}>
            <p>📧 <a href="mailto:contact@job-ici.com" style={linkStyle}>contact@job-ici.com</a></p>
            <p>🌐 <Link href="/contact" style={linkStyle}>Formulaire de contact</Link></p>
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
const h3Style: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 10,
};
const pStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)',
  marginBottom: 14,
};
const ulStyle: React.CSSProperties = {
  paddingLeft: 20, marginBottom: 14,
};
const liStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)',
  marginBottom: 6,
};
const infoBox: React.CSSProperties = {
  background: 'var(--cream)', padding: '20px 24px', borderRadius: 12,
  marginTop: 12, marginBottom: 16, border: '1px solid var(--border)',
};
const methodBoxStyle: React.CSSProperties = {
  background: 'var(--cream)', padding: '20px 24px', borderRadius: 12,
  marginBottom: 16, border: '1px solid var(--border)',
};
const linkStyle: React.CSSProperties = {
  color: 'var(--teal)', fontWeight: 600, textDecoration: 'underline',
};
const btnStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'var(--teal)', color: 'var(--navy)',
  padding: '12px 20px', borderRadius: 10,
  fontWeight: 800, fontSize: 14, textDecoration: 'none',
  marginTop: 4,
};
const tableWrapStyle: React.CSSProperties = {
  overflowX: 'auto', marginBottom: 16,
};
const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 14,
};
const thStyle: React.CSSProperties = {
  background: 'var(--navy)', color: 'white',
  padding: '10px 14px', textAlign: 'left', fontWeight: 700,
};
const trStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border)',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', color: 'var(--text-dark)', verticalAlign: 'top',
};
const codeStyle: React.CSSProperties = {
  background: 'var(--cream)', padding: '2px 6px', borderRadius: 4,
  fontSize: 12, fontFamily: 'monospace',
};
