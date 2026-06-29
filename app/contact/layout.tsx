import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact',
  description:
    "Une question sur Jobici ? Contactez notre équipe via le formulaire ou par email à contact@job-ici.com. Nous vous répondons rapidement.",
  path: '/contact',
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
