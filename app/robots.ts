import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Pages privées / sans valeur SEO : on bloque l'exploration
      disallow: [
        '/admin',
        '/messages',
        '/profil',
        '/connexion',
        '/inscription',
        '/mot-de-passe-oublie',
        '/reinitialiser-mot-de-passe',
        '/offres/succes',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
