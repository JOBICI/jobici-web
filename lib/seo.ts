import { cache } from 'react';
import { supabase } from './supabase';

// ── Constantes SEO globales ──────────────────────────────────────────────
export const SITE_URL = 'https://job-ici.com';
export const SITE_NAME = 'Jobici';
export const SITE_REGION = 'Ardèche & Auvergne-Rhône-Alpes';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Villes principales couvertes (Ardèche + grandes villes Auvergne-Rhône-Alpes)
// Sert au maillage interne et aux mots-clés locaux.
export const VILLES = [
  'Aubenas', 'Privas', 'Annonay', 'Tournon-sur-Rhône', 'Guilherand-Granges',
  'Le Teil', 'Bourg-Saint-Andéol', 'Vals-les-Bains', 'Valence', 'Lyon',
];

// Métiers / catégories de missions (sert au maillage et aux mots-clés)
export const METIERS = [
  'Ménage', 'Jardinage', 'Garde d\'enfants', 'Déménagement', 'Bricolage',
  'Livraison', 'Cours particuliers', 'Plomberie', 'Électricité', 'Peinture',
];

// Mots-clés réutilisables
export const KEYWORDS = [
  'missions de proximité', 'jobs étudiants', 'auto-entrepreneur',
  'travailleur indépendant', 'petits boulots', 'recrutement local',
  'CESU', 'Ardèche', 'Auvergne-Rhône-Alpes', 'services à domicile',
];

// ── Helper de construction de metadata par page ──────────────────────────
type PageMetaInput = {
  title: string;
  description: string;
  /** chemin relatif, ex: "/missions" */
  path: string;
  keywords?: string[];
  noindex?: boolean;
};

export function pageMetadata({ title, description, path, keywords, noindex }: PageMetaInput) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords: keywords ?? KEYWORDS,
    alternates: { canonical: path },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: OG_IMAGE, width: 1080, height: 1080, alt: SITE_NAME }],
      locale: 'fr_FR',
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}

// ── Fetchers côté serveur, mémoïsés (dédoublonnent metadata + JSON-LD) ────
export type MissionSeo = {
  id: string;
  titre: string;
  description: string | null;
  ville: string | null;
  tarif: number | null;
  type: string | null;
  date_mission: string | null;
  created_at: string | null;
  statut: string | null;
};

export const getMissionSeo = cache(async (id: string): Promise<MissionSeo | null> => {
  const { data } = await supabase
    .from('missions')
    .select('id, titre, description, ville, tarif, type, date_mission, created_at, statut')
    .eq('id', id)
    .single();
  return (data as MissionSeo) ?? null;
});

export type AutoSeo = {
  id: string;
  nom: string;
  ville: string | null;
  metier: string | null;
  bio: string | null;
  note_moyenne: number | null;
  nb_missions: number | null;
};

export const getAutoSeo = cache(async (id: string): Promise<AutoSeo | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('id, nom, ville, metier, bio, note_moyenne, nb_missions')
    .eq('id', id)
    .eq('statut', 'autoentrepreneur')
    .single();
  return (data as AutoSeo) ?? null;
});
