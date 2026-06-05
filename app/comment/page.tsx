'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STEPS_EMP = [
  { n: 1, e: '📱', t: 'Inscrivez-vous',       d: 'Inscription gratuite en 2 minutes. Créez votre compte (Professionnel ou Particulier).' },
  { n: 2, e: '📋', t: 'Publiez votre mission', d: 'Décrivez ce que vous recherchez, fixez le tarif et la date. L\'annonce est en ligne immédiatement.' },
  { n: 3, e: '👤', t: 'Choisissez votre candidat', d: 'Les travailleurs intéressés vous contactent. Consultez leurs profils, notes et avis avant de décider.' },
  { n: 4, e: '💳', t: 'Payez en sécurité',    d: 'Le paiement est bloqué via Stripe à l\'acceptation, puis libéré au travailleur après validation.' },
];

const STEPS_WORK = [
  { n: 1, e: '📱', t: 'Télécharge l\'app',  d: 'Inscription gratuite. Indique tes compétences et disponibilités.' },
  { n: 2, e: '🔍', t: 'Parcourez les missions', d: 'Filtrez par catégorie, ville, tarif. Trouvez la mission qui vous convient.' },
  { n: 3, e: '💬', t: 'Postulez en 1 clic',  d: 'Envoyez votre candidature. L\'employeur reçoit une notification et vous contacte si votre profil l\'intéresse.' },
  { n: 4, e: '💰', t: 'Travaillez et soyez payé', d: 'Réalisez la mission, validez. Vous recevez votre paiement sous 48h, sans commission.' },
];

const FAQ = [
  {
    q: "Quelle est la différence entre un Pro et un Particulier ?",
    a: "Un Professionnel est une entreprise immatriculée (boutique, restaurant, etc.) qui cherche du personnel. Commission de 20% HT. Un Particulier est une personne physique qui cherche de l'aide pour des tâches du quotidien. Commission de 15% via le mandat CESU."
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Le paiement est sécurisé via Stripe. Le montant est bloqué dès l'acceptation de la mission, puis libéré au travailleur sous 48 heures après validation. Aucune carte bancaire n'est stockée par Jobici."
  },
  {
    q: "Suis-je couvert si quelque chose se passe mal ?",
    a: "Tous les utilisateurs sont vérifiés à l'inscription (pièce d'identité, justificatif de domicile). Notre service client est disponible 7j/7 par email à contact@job-ici.com. En cas de litige, médiation gratuite via CM2C."
  },
  {
    q: "Les mineurs peuvent-ils utiliser Jobici ?",
    a: "Oui, dès 14 ans avec autorisation parentale. Les missions des mineurs sont encadrées strictement conformément au Code du travail. Une réduction tarifaire est appliquée pour respecter le SMIC mineur."
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun engagement. L'inscription et l'utilisation de l'app sont gratuites. Les commissions ne sont prélevées que lorsque vous réalisez ou faites réaliser une mission. Vous pouvez supprimer votre compte à tout moment."
  },
  {
    q: "Dans quelles villes Jobici est disponible ?",
    a: "Au lancement, Jobici est disponible en Auvergne-Rhône-Alpes (Valence, Romans, Privas, Aubenas, Annonay, Lyon, Grenoble, etc.). Déploiement national prévu courant 2026."
  },
];

const stepStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: '32px 24px', textAlign: 'center',
  border: '1px solid var(--border)', position: 'relative',
};

const stepNumStyle: React.CSSProperties = {
  position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
  width: 36, height: 36, background: 'var(--teal)', color: 'var(--navy)',
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontSize: 15,
};

export default function CommentPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Comment ça marche ? 🤔</h1>
          <p>Jobici est conçu pour être simple et rapide. Voici le parcours pour publier une mission ou en accepter une.</p>
        </div>
      </section>

      <section className="page-content">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: 8 }}>Côté Employeur 💼</h2>
          <p className="section-subtitle">Vous cherchez un travailleur pour une mission ponctuelle ou récurrente.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 40 }}>
            {STEPS_EMP.map(s => (
              <div key={s.n} style={stepStyle}>
                <div style={stepNumStyle}>{s.n}</div>
                <span style={{ fontSize: 56, display: 'block', marginBottom: 12 }}>{s.e}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--navy)' }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>

          <h2 className="section-title" style={{ marginBottom: 8, marginTop: 100 }}>Côté Travailleur 👥</h2>
          <p className="section-subtitle">Vous cherchez une mission, ponctuelle ou récurrente.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 40 }}>
            {STEPS_WORK.map(s => (
              <div key={s.n} style={stepStyle}>
                <div style={stepNumStyle}>{s.n}</div>
                <span style={{ fontSize: 56, display: 'block', marginBottom: 12 }}>{s.e}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--navy)' }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '80px 0' }}>
        <div className="container">
          <h2 className="section-title">Questions fréquentes</h2>
          <p className="section-subtitle">On répond à toutes vos questions.</p>

          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {FAQ.map((f, i) => (
              <div
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  background: 'var(--cream)', borderRadius: 14, padding: '20px 22px', marginBottom: 12,
                  border: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: 'var(--navy)', gap: 14 }}>
                  <span style={{ fontSize: 15 }}>{f.q}</span>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: openFaq === i ? 'var(--teal)' : 'var(--teal-light)',
                    color: openFaq === i ? 'white' : 'var(--teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, transition: 'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'none'
                  }}>+</span>
                </div>
                {openFaq === i && (
                  <p style={{ marginTop: 14, color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.7 }}>{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="missions-section" style={{ paddingTop: 60 }}>
        <div className="cta-box">
          <span className="cta-emoji">🚀</span>
          <div className="cta-text">
            <h3>Prêt à vous lancer ?</h3>
            <p>Inscrivez-vous gratuitement et commencez à publier ou postuler à des missions.</p>
          </div>
          <Link href="/inscription" className="btn-primary">S'inscrire gratuitement →</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
