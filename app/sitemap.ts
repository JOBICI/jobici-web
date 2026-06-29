import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/seo';

// Revalidation : le sitemap est régénéré au plus toutes les heures
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Pages statiques (indexables) ──
  const staticBase: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                  changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/missions`,          changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/auto-entrepreneurs`,changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/pros`,              changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/travailleurs`,      changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/comment`,           changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/offres`,            changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/classement`,        changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${SITE_URL}/contact`,           changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${SITE_URL}/cgu`,               changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/cgv`,               changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`,   changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/mentions-legales`,  changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/cookies`,           changeFrequency: 'yearly',  priority: 0.2 },
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticBase.map((r) => ({ ...r, lastModified: now }));

  // ── Missions actives (URLs dynamiques) ──
  let missionRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabase
      .from('missions')
      .select('id, created_at')
      .eq('statut', 'active')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (data) {
      missionRoutes = data.map((m: { id: string; created_at: string | null }) => ({
        url: `${SITE_URL}/missions/${m.id}`,
        lastModified: m.created_at ? new Date(m.created_at) : now,
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch {
    // En cas d'erreur Supabase, on renvoie au moins les pages statiques.
  }

  // ── Profils auto-entrepreneurs mis en avant (abonnement actif) ──
  let autoRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: packs } = await supabase
      .from('user_purchases')
      .select('user_id')
      .eq('offer_id', 'pack_visibilite_auto')
      .eq('status', 'active');
    const ids = (packs ?? []).map((p: { user_id: string }) => p.user_id);
    if (ids.length > 0) {
      const { data: autos } = await supabase
        .from('profiles')
        .select('id')
        .eq('statut', 'autoentrepreneur')
        .in('id', ids);
      if (autos) {
        autoRoutes = autos.map((a: { id: string }) => ({
          url: `${SITE_URL}/auto-entrepreneurs/${a.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch {
    // idem
  }

  return [...staticRoutes, ...missionRoutes, ...autoRoutes];
}
