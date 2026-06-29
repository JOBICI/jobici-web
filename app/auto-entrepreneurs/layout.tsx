import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Auto-entrepreneurs près de chez vous',
  description:
    'Trouvez un auto-entrepreneur qualifié en Ardèche et contactez-le directement : plomberie, électricité, ménage, jardinage, peinture… Devis rapide, sans intermédiaire.',
  path: '/auto-entrepreneurs',
});

export default function AutoEntrepreneursLayout({ children }: { children: ReactNode }) {
  return children;
}
