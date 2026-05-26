import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = { title: "Pour les Travailleurs — Jobici" };

export default function TravailleursPage() {
  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Trouve des missions <span className="teal-text">près de chez toi</span> 👥</h1>
          <p>Étudiant, auto-entrepreneur, en recherche d'emploi ? Jobici te connecte aux missions de proximité avec 0% de commission.</p>
        </div>
      </section>

      <section className="page-content">
        <div className="content-grid">
          <div className="content-text">
            <h2>0% de commission sur tes gains 💸</h2>
            <p>Contrairement aux plateformes traditionnelles, Jobici ne prend <strong>aucune commission</strong> sur ce que tu gagnes. 100% du tarif négocié va dans ta poche.</p>
            <ul>
              <li>Gagne plus qu'ailleurs</li>
              <li>Pas de frais cachés</li>
              <li>Tarification transparente</li>
              <li>Paiement sous 48h</li>
            </ul>
          </div>
          <div className="content-visual">
            <span className="big-emoji">💰</span>
            <h3>100% pour toi</h3>
            <p>Garde tout ce que tu gagnes.</p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 80 }}>
          <div className="content-visual dark">
            <span className="big-emoji">📄</span>
            <h3>Tout est en règle</h3>
            <p>Jobici gère ta déclaration URSSAF pour toi.</p>
          </div>
          <div className="content-text">
            <h2>Mandat CESU automatique 📋</h2>
            <p>Pour les missions chez les particuliers, Jobici s'occupe de tout : déclaration URSSAF, calcul des cotisations, fiche de paie. Tu es <strong>déclaré comme salarié</strong>, en toute légalité.</p>
            <ul>
              <li>Cotisations sociales prises en charge</li>
              <li>Bulletin de paie automatique</li>
              <li>Retraite et chômage cotisés</li>
              <li>Aucune paperasse de ton côté</li>
            </ul>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 80 }}>
          <div className="content-text">
            <h2>Système d'XP et badges 🏆</h2>
            <p>Plus tu travailles, plus tu gagnes d'XP et débloques des badges qui te font passer dans les premières positions des recherches.</p>
            <ul>
              <li>Niveaux de Bronze à Diamant</li>
              <li>20 badges à débloquer</li>
              <li>Classement local et national</li>
              <li>Récompenses pour ta fidélité</li>
            </ul>
          </div>
          <div className="content-visual">
            <span className="big-emoji">🏅</span>
            <h3>Monte les niveaux</h3>
            <p>Plus tu travailles, plus tu es visible.</p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 80 }}>
          <div className="content-visual dark">
            <span className="big-emoji">🎒</span>
            <h3>Spécial étudiants</h3>
            <p>Trouve des jobs flexibles pour ton planning.</p>
          </div>
          <div className="content-text">
            <h2>Accessible dès 14 ans 🎓</h2>
            <p>Tu es lycéen et tu cherches un petit boulot ? Jobici te permet de travailler dès <strong>14 ans avec autorisation parentale</strong>, dans le respect strict du Code du travail.</p>
            <ul>
              <li>Missions adaptées à ton âge</li>
              <li>Heures de travail limitées légalement</li>
              <li>SMIC minimum garanti</li>
              <li>Autorisation parentale numérique</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '80px 0' }}>
        <div className="container">
          <h2 className="section-title">Quelles missions tu peux trouver ?</h2>
          <p className="section-subtitle">Une grande variété de missions, du ponctuel au long terme.</p>

          <div className="features-grid" style={{ marginTop: 40 }}>
            {[
              { emoji: '🧹', titre: 'Ménage',           desc: 'Particuliers, locations courte durée, bureaux' },
              { emoji: '🌿', titre: 'Jardinage',        desc: 'Tonte, entretien, plantations' },
              { emoji: '👶', titre: 'Garde d\'enfants', desc: 'Baby-sitting, accompagnement, sortie école' },
              { emoji: '📦', titre: 'Déménagement',     desc: 'Aide au chargement/déchargement, transport' },
              { emoji: '🛵', titre: 'Livraison',        desc: 'Courses, repas, colis' },
              { emoji: '📚', titre: 'Cours particuliers', desc: 'Soutien scolaire, langues, musique' },
              { emoji: '🛍️', titre: 'Vente / Boutique',  desc: 'Renfort en boutique, conseils clients' },
              { emoji: '🍽️', titre: 'Restauration',      desc: 'Service, cuisine, plonge' },
            ].map(c => (
              <div key={c.titre} className="feature-card">
                <span className="feature-emoji">{c.emoji}</span>
                <h3>{c.titre}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="missions-section" style={{ paddingTop: 60 }}>
        <div className="cta-box">
          <span className="cta-emoji">🚀</span>
          <div className="cta-text">
            <h3>Prêt à trouver ta première mission ?</h3>
            <p>Télécharge l'app Jobici et accède immédiatement aux missions disponibles près de chez toi.</p>
          </div>
          <Link href="/contact" className="btn-primary">Télécharger l'app →</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
