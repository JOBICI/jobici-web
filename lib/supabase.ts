import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://peoufukrwwcbzxiqqlzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlb3VmdWtyd3djYnp4aXFxbHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDQyMTEsImV4cCI6MjA5MTUyMDIxMX0.1WCDEserlN5dYaRKXFJjDl9A80E9M_xMixUkGaDeNQg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Mission = {
  id: string;
  created_at: string;
  employeur_id: string;
  titre: string;
  description: string;
  ville: string;
  emoji: string;
  type: string;
  duree: string;
  date_mission: string;
  horaires: string;
  profil_requis: string;
  tarif: number;
  est_urgent: boolean;
  statut: string;
};
