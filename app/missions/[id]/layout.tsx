import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import JsonLd from '@/components/JsonLd';
import { getMissionSeo, SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/seo';

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
  const mission = await getMissionSeo(id);

  if (!mission) {
    return {
      title: 'Mission introuvable',
      description: "Cette mission n'existe plus ou a été supprimée.",
      robots: { index: false, follow: true },
    };
  }

  const ville = mission.ville ? ` à ${mission.ville}` : '';
  const tarif = mission.tarif ? ` — ${mission.tarif} €` : '';
  const title = `${mission.titre}${ville}`;
  const description = mission.description
    ? truncate(`${mission.titre}${ville}${tarif}. ${mission.description}`)
    : `Mission${ville}${tarif} à pourvoir sur Jobici. Postulez gratuitement et échangez directement avec l'employeur.`;
  const path = `/missions/${id}`;
  const isActive = mission.statut === 'active';

  return {
    title,
    description,
    alternates: { canonical: path },
    // On désindexe les missions clôturées pour garder un index propre.
    robots: isActive ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: 'article',
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

export default async function MissionDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const mission = await getMissionSeo(id);

  if (!mission) return children;

  const path = `/missions/${id}`;
  const url = `${SITE_URL}${path}`;
  const datePosted = mission.created_at ?? new Date().toISOString();
  // Offre considérée valide 60 jours après publication
  const validThrough = new Date(
    new Date(datePosted).getTime() + 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const jobJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: mission.titre,
    description:
      mission.description ||
      `Mission de proximité à pourvoir sur ${SITE_NAME}.`,
    datePosted,
    validThrough,
    employmentType: 'CONTRACTOR',
    directApply: true,
    identifier: {
      '@type': 'PropertyValue',
      name: SITE_NAME,
      value: mission.id,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_NAME,
      sameAs: SITE_URL,
      logo: OG_IMAGE,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: mission.ville || 'Ardèche',
        addressRegion: 'Auvergne-Rhône-Alpes',
        addressCountry: 'FR',
      },
    },
    url,
    ...(mission.tarif
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'EUR',
            value: {
              '@type': 'QuantitativeValue',
              value: mission.tarif,
              unitText: 'DAY',
            },
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Missions', item: `${SITE_URL}/missions` },
      { '@type': 'ListItem', position: 3, name: mission.titre, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={[jobJsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
