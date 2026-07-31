'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Tag Google Analytics 4 (gtag.js), chargé UNIQUEMENT si l'utilisateur a
// accepté les cookies d'analyse (conformité CNIL/RGPD).
// L'ID peut être surchargé via NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-W0BCE2124D';
const COOKIE_KEY = 'jobici_cookies_consent';

function analyticsConsentGranted(): boolean {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent?.analytics === true;
  } catch {
    return false;
  }
}

export default function Analytics() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // État initial (choix déjà enregistré ?)
    setGranted(analyticsConsentGranted());

    // Réagir en direct au choix dans la bannière + synchro entre onglets
    const refresh = () => setGranted(analyticsConsentGranted());
    window.addEventListener('jobici-consent-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('jobici-consent-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!GA_ID || !granted) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
