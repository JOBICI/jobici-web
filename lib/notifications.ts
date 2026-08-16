// lib/notifications.ts — Envoi de notifications push (même API Expo que l'app mobile)
import { supabase } from './supabase';

async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }),
  });
}

// ── Notifier le travailleur que la mission est terminée : à son tour de noter ──
export async function notifyMissionTerminee(travailleurId: string, missionTitre: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', travailleurId)
    .single();

  if (!profile?.push_token) return;

  await sendPushNotification(
    profile.push_token,
    '🏁 Mission terminée',
    `"${missionTitre}" est marquée comme terminée. À votre tour de noter le professionnel !`,
    { type: 'mission_terminee', travailleurId }
  );
}
