import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Comment ça marche',
  description:
    "Découvrez comment fonctionne Jobici : publier une mission, postuler, paiement sécurisé et 0 % de commission pour les travailleurs. Le guide complet de la plateforme.",
  path: '/comment',
});

export default function CommentLayout({ children }: { children: ReactNode }) {
  return children;
}
