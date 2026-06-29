import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Classement des travailleurs',
  description:
    'Le classement des travailleurs et auto-entrepreneurs les mieux notés de Jobici : XP, niveaux et missions réalisées près de chez vous.',
  path: '/classement',
});

export default function ClassementLayout({ children }: { children: ReactNode }) {
  return children;
}
