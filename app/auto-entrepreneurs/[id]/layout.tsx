import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/JsonLd';
import { getAutoSeo, SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/seo';

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const profile = await getAutoSeo(id);

  if (!profile) {
    return {
      title: 'Profil introuvable',
      description: "Ce profil n'existe pas ou n'est plus disponible.",
      robots: { index: false, follow: true },
    };
  }

  const metier = profile.metier || 'Auto-entrepreneur';
  const ville = profile.ville ? ` à ${profile.ville}` : '';
  const title = `${metier}${ville} — ${profile.nom}`;
  const description = profile.bio
    ? truncate(`${metier}${ville} : ${profile.bio}`)
    : `${profile.nom}, ${metier.toLowerCase()}${ville}. Contactez ce professionnel directement sur Jobici pour un devis rapide, sans intermédiaire.`;
  const path = `/auto-entrepreneurs/${id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: 'profile',
      images: [{ url: OG_IMAGE, width: 1080, height: 1080, alt: SITE_NAME }],
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function AutoEntrepreneurLayout({ children, params }: Props) {
  const { id } = await params;
  const profile = await getAutoSeo(id);

  if (!profile) return children;

  const metier = profile.metier || 'Auto-entrepreneur';
  const path = `/auto-entrepreneurs/${id}`;
  const url = `${SITE_URL}${path}`;

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: profile.nom,
    description:
      profile.bio ||
      `${profile.nom}, ${metier.toLowerCase()} auto-entrepreneur disponible sur ${SITE_NAME}.`,
    url,
    image: OG_IMAGE,
    serviceType: metier,
    areaServed: profile.ville || 'Ardèche',
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.ville || 'Ardèche',
      addressRegion: 'Auvergne-Rhône-Alpes',
      addressCountry: 'FR',
    },
    // Note moyenne réellement affichée sur la page → étoiles dans les résultats
    ...(profile.note_moyenne != null && (profile.nb_missions ?? 0) > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: profile.note_moyenne,
            reviewCount: profile.nb_missions,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Auto-entrepreneurs',
        item: `${SITE_URL}/auto-entrepreneurs`,
      },
      { '@type': 'ListItem', position: 3, name: profile.nom, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={[serviceJsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
