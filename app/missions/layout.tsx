import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Missions près de chez vous',
  description:
    "Toutes les missions de proximité disponibles en Ardèche et Auvergne-Rhône-Alpes : ménage, jardinage, bricolage, garde d'enfants, livraison, déménagement… Postulez gratuitement sur Jobici.",
  path: '/missions',
});

export default function MissionsLayout({ children }: { children: ReactNode }) {
  return children;
}
