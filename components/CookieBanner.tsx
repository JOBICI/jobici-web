'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_KEY = 'jobici_cookies_consent';

type CookieConsent = {
  essential: boolean; // toujours true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Préférences personnalisées
  const [analyticsAccepted, setAnalyticsAccepted] = useState(true);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  useEffect(() => {
    // Vérifier si un choix a déjà été fait
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Afficher la bannière après un petit délai pour ne pas brutaliser
      setTimeout(() => setVisible(true), 500);
    }
  }, []);

  function saveConsent(consent: CookieConsent) {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
    setVisible(false);
  }

  function acceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  }

  function rejectAll() {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  }

  function saveCustom() {
    saveConsent({
      essential: true,
      analytics: analyticsAccepted,
      marketing: marketingAccepted,
      timestamp: new Date().toISOString(),
    });
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay sombre */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13, 31, 45, 0.4)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Bannière en bas */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'white',
          borderTop: '4px solid var(--teal)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
          padding: '24px 20px',
          animation: 'slideUp 0.4s ease-out',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {!showCustomize ? (
            /* ─── BANNIÈRE PRINCIPALE ─── */
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontSize: 36, flexShrink: 0 }}>🍪</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
                    Vos cookies, vos choix
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                    Nous utilisons des cookies essentiels au bon fonctionnement de Jobici. Avec votre accord,
                    nous utilisons également des cookies pour analyser notre trafic et améliorer votre expérience.
                    Vous pouvez modifier vos choix à tout moment depuis le pied de page.{' '}
                    <Link href="/confidentialite" style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'underline' }}>
                      En savoir plus
                    </Link>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCustomize(true)} style={btnSecondaryStyle}>
                  ⚙️ Personnaliser
                </button>
                <button onClick={rejectAll} style={btnSecondaryStyle}>
                  ❌ Tout refuser
                </button>
                <button onClick={acceptAll} style={btnPrimaryStyle}>
                  ✅ Tout accepter
                </button>
              </div>
            </>
          ) : (
            /* ─── PERSONNALISATION ─── */
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
                ⚙️ Personnaliser mes cookies
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 20 }}>
                Choisissez les types de cookies que vous acceptez.
              </p>

              {/* Cookies essentiels */}
              <div style={cookieRowStyle}>
                <div style={{ flex: 1 }}>
                  <p style={cookieTitleStyle}>🔒 Cookies essentiels</p>
                  <p style={cookieDescStyle}>
                    Nécessaires au fonctionnement du site (connexion, navigation). Ne peuvent être désactivés.
                  </p>
                </div>
                <div style={{ ...toggleStyle, background: 'var(--teal)', cursor: 'not-allowed', opacity: 0.6 }}>
                  <span style={{ ...toggleCircleStyle, transform: 'translateX(20px)' }} />
                </div>
              </div>

              {/* Cookies analytiques */}
              <div style={cookieRowStyle}>
                <div style={{ flex: 1 }}>
                  <p style={cookieTitleStyle}>📊 Cookies d'analyse</p>
                  <p style={cookieDescStyle}>
                    Nous aident à comprendre comment vous utilisez Jobici pour améliorer le service (anonymisé).
                  </p>
                </div>
                <button
                  onClick={() => setAnalyticsAccepted(!analyticsAccepted)}
                  style={{
                    ...toggleStyle,
                    background: analyticsAccepted ? 'var(--teal)' : 'var(--border)',
                  }}
                >
                  <span style={{
                    ...toggleCircleStyle,
                    transform: analyticsAccepted ? 'translateX(20px)' : 'translateX(0)',
                  }} />
                </button>
              </div>

              {/* Cookies marketing */}
              <div style={cookieRowStyle}>
                <div style={{ flex: 1 }}>
                  <p style={cookieTitleStyle}>📣 Cookies marketing</p>
                  <p style={cookieDescStyle}>
                    Permettent d'afficher des publicités personnalisées (actuellement non utilisés).
                  </p>
                </div>
                <button
                  onClick={() => setMarketingAccepted(!marketingAccepted)}
                  style={{
                    ...toggleStyle,
                    background: marketingAccepted ? 'var(--teal)' : 'var(--border)',
                  }}
                >
                  <span style={{
                    ...toggleCircleStyle,
                    transform: marketingAccepted ? 'translateX(20px)' : 'translateX(0)',
                  }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowCustomize(false)} style={btnSecondaryStyle}>
                  ← Retour
                </button>
                <button onClick={saveCustom} style={btnPrimaryStyle}>
                  💾 Enregistrer mes choix
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Fonction utilitaire exportée pour rouvrir la bannière depuis le footer ───
export function reopenCookieBanner() {
  localStorage.removeItem(COOKIE_KEY);
  window.location.reload();
}

// ─── Styles ───
const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--teal)', color: 'var(--navy)',
  padding: '12px 20px', border: 'none', borderRadius: 10,
  fontWeight: 800, fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent', color: 'var(--navy)',
  padding: '12px 20px', border: '1.5px solid var(--border)',
  borderRadius: 10, fontWeight: 700, fontSize: 14,
  cursor: 'pointer', fontFamily: 'inherit',
};

const cookieRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '16px 0', borderBottom: '1px solid var(--border)',
};

const cookieTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4,
};

const cookieDescStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5,
};

const toggleStyle: React.CSSProperties = {
  width: 44, height: 24, borderRadius: 999,
  border: 'none', cursor: 'pointer', flexShrink: 0,
  position: 'relative', transition: 'background 0.2s',
  padding: 2,
};

const toggleCircleStyle: React.CSSProperties = {
  display: 'block', width: 20, height: 20,
  background: 'white', borderRadius: '50%',
  transition: 'transform 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
};