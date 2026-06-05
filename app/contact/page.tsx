'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [nom, setNom]         = useState('');
  const [email, setEmail]     = useState('');
  const [sujet, setSujet]     = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Nom: ${nom}\nEmail: ${email}\nSujet: ${sujet}\n\n${message}`;
    window.location.href = `mailto:contact@job-ici.com?subject=${encodeURIComponent(sujet || 'Contact Jobici')}&body=${encodeURIComponent(body)}`;
  };

  const infoCardStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 16, padding: 18,
    background: 'white', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 14,
  };

  return (
    <>
      <Header />

      <section className="page-hero">
        <div className="container">
          <h1>Contacte-nous 📧</h1>
          <p>Une question, une suggestion, un partenariat ? On te répond sous 48h ouvrées.</p>
        </div>
      </section>

      <section className="page-content">
        <div className="content-grid">
          <div className="content-text">
            <h2>Nos coordonnées</h2>
            <p>L'équipe Jobici est basée en Ardèche et reste joignable par mail. Un service client 7j/7 sera mis en place pour le lancement officiel.</p>

            <div style={{ marginTop: 30 }}>
              <div style={infoCardStyle}>
                <span style={{ fontSize: 32 }}>📧</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--navy)', fontSize: 14 }}>Email</strong>
                  <a href="mailto:contact@job-ici.com" style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 14 }}>contact@job-ici.com</a>
                </div>
              </div>

              <div style={infoCardStyle}>
                <span style={{ fontSize: 32 }}>🌐</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--navy)', fontSize: 14 }}>Site web</strong>
                  <span style={{ color: 'var(--text-mid)', fontSize: 14 }}>job-ici.com</span>
                </div>
              </div>

              <div style={infoCardStyle}>
                <span style={{ fontSize: 32 }}>📍</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--navy)', fontSize: 14 }}>Implantation</strong>
                  <span style={{ color: 'var(--text-mid)', fontSize: 14 }}>Auvergne-Rhône-Alpes</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: 40, borderRadius: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Formulaire de contact</h3>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 12 }}>Réponse sous 48h ouvrées.</p>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Nom complet</label>
              <input type="text" required value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Dylan Redon" style={inputStyle} />

              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ex@email.com" style={inputStyle} />

              <label style={labelStyle}>Sujet</label>
              <select required value={sujet} onChange={e => setSujet(e.target.value)} style={inputStyle}>
                <option value="">— Choisis un sujet —</option>
                <option>Question générale</option>
                <option>Partenariat</option>
                <option>Devenir Pro Jobici</option>
                <option>Bug ou problème</option>
                <option>Presse / Médias</option>
                <option>Autre</option>
              </select>

              <label style={labelStyle}>Message</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Écris ton message ici…" style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} />

              <button type="submit" style={btnStyle}>Envoyer le message</button>
            </form>
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', color: 'white', padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 14 }}>📱 Télécharge l'app Jobici</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 540, margin: '0 auto 32px' }}>
            Jobici sera bientôt disponible sur App Store et Google Play. Laissez-nous votre email pour être prévenu en avant-première !
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:contact@job-ici.com?subject=Avant-première Jobici" style={storeBtnStyle}>
              <span style={{ fontSize: 24 }}>🍎</span> App Store <span style={badgeSoon}>BIENTÔT</span>
            </a>
            <a href="mailto:contact@job-ici.com?subject=Avant-première Jobici" style={storeBtnStyle}>
              <span style={{ fontSize: 24 }}>▶️</span> Google Play <span style={badgeSoon}>BIENTÔT</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 6, marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit',
};

const btnStyle: React.CSSProperties = {
  width: '100%', background: 'var(--teal)', color: 'var(--navy)', padding: 14,
  border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 24,
  fontFamily: 'inherit',
};

const storeBtnStyle: React.CSSProperties = {
  background: 'white', color: 'var(--navy)', padding: '16px 28px', borderRadius: 14,
  fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: 10,
};

const badgeSoon: React.CSSProperties = {
  background: 'var(--urgent)', color: 'white', padding: '3px 8px', borderRadius: 6,
  fontSize: 10, fontWeight: 800,
};
