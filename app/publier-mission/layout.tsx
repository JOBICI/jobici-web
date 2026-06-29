import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Publier une mission',
  description:
    'Publiez gratuitement votre mission sur Jobici et trouvez un travailleur de confiance près de chez vous en quelques minutes. Pour les particuliers et les professionnels.',
  path: '/publier-mission',
});

export default function PublierMissionLayout({ children }: { children: ReactNode }) {
  return children;
}
