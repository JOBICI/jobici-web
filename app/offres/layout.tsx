import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Offres & Tarifs',
  description:
    "Boostez votre visibilité sur Jobici : boost d'annonce, pack mensuel particulier et professionnel, mise en avant auto-entrepreneur. Des offres claires à partir de 2 €.",
  path: '/offres',
});

export default function OffresLayout({ children }: { children: ReactNode }) {
  return children;
}
