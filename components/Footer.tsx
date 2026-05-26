import Link from 'next/link';
import CookieButton from './CookieButton';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo">
              <span className="logo-text">job<span className="accent">ici</span></span>
            </Link>
            <p className="footer-text">La plateforme de mise en relation pour des missions de proximité.</p>
          </div>
          <div>
            <h5>Plateforme</h5>
            <ul>
              <li><Link href="/missions">Missions</Link></li>
              <li><Link href="/auto-entrepreneurs">Auto-entrepreneurs</Link></li>
              <li><Link href="/offres">Offres & Tarifs</Link></li>
              <li><Link href="/pros">Pour les Pros</Link></li>
              <li><Link href="/travailleurs">Pour les Travailleurs</Link></li>
              <li><Link href="/comment">Comment ça marche</Link></li>
            </ul>
          </div>
          <div>
            <h5>Légal</h5>
            <ul>
              <li><Link href="/cgu">CGU</Link></li>
              <li><Link href="/cgv">CGV</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/cookies">Politique de cookies</Link></li>
              <CookieButton />
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href="mailto:contact@job-ici.com">contact@job-ici.com</a></li>
              <li><Link href="/contact">Formulaire</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 JOBICI SASU — Tous droits réservés</span>
          <span>Fait avec ❤️ en Ardèche</span>
        </div>
      </div>
    </footer>
  );
}
