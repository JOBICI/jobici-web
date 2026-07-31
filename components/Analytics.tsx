import Script from 'next/script';

// Tag Google Analytics 4 (gtag.js). L'ID peut être surchargé via la variable
// d'environnement NEXT_PUBLIC_GA_ID (sinon, valeur par défaut ci-dessous).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-W0BCE2124D';

export default function Analytics() {
  if (!GA_ID) return null;

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
