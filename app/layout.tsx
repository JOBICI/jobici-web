import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobici — Trouvez votre mission près de chez vous",
  description: "Plateforme de mise en relation entre particuliers, professionnels et travailleurs en Auvergne-Rhône-Alpes.",
  themeColor: "#0D1F2D",
  openGraph: {
    title: "Jobici — Trouvez votre mission près de chez vous",
    description: "Plateforme de mise en relation pour des missions de proximité. Gratuit, rapide, sans intermédiaire.",
    url: "https://job-ici.com",
    siteName: "Jobici",
    images: [{ url: "https://job-ici.com/og-image.png", width: 1080, height: 1080, alt: "Jobici" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Jobici — Trouvez votre mission près de chez vous",
    description: "Plateforme de mise en relation pour des missions de proximité.",
    images: ["https://job-ici.com/og-image.png"],
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
        <AuthProvider>{children}</AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
