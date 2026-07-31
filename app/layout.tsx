import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import CookieBanner from "@/components/CookieBanner";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import { SITE_URL, SITE_NAME, OG_IMAGE, KEYWORDS } from "@/lib/seo";
import "./globals.css";

const DEFAULT_TITLE =
  "Jobici — Missions et auto-entrepreneurs près de chez vous en Ardèche";
const DEFAULT_DESCRIPTION =
  "Jobici met en relation particuliers, professionnels, étudiants et auto-entrepreneurs pour des missions de proximité en Ardèche et Auvergne-Rhône-Alpes. Gratuit, rapide, paiement sécurisé.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "JOBICI SASU", url: SITE_URL }],
  creator: "JOBICI SASU",
  publisher: "JOBICI SASU",
  category: "Emploi & services de proximité",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description:
      "Plateforme de mise en relation pour des missions de proximité. Gratuit, rapide, sans intermédiaire.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1080, height: 1080, alt: SITE_NAME }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: "Plateforme de mise en relation pour des missions de proximité.",
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1F2D",
};

// Données structurées globales : entité Organisation + Site (avec recherche)
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  legalName: "JOBICI SASU",
  url: SITE_URL,
  logo: OG_IMAGE,
  description: DEFAULT_DESCRIPTION,
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Ardèche, Auvergne-Rhône-Alpes, France",
  },
  email: "contact@job-ici.com",
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/missions?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <JsonLd data={[orgJsonLd, siteJsonLd]} />
        <AuthProvider>{children}</AuthProvider>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
