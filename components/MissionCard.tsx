import Link from 'next/link';
import type { Mission } from '@/lib/supabase';

// Palette de couleurs pour les fonds des cards (selon emoji)
const BG_COLORS: Record<string, string> = {
  '📦': 'linear-gradient(135deg, #E0F7F3, #C5F0E8)',
  '🛍️': 'linear-gradient(135deg, #FFE5E5, #FFD1D1)',
  '🛵': 'linear-gradient(135deg, #FFF3CD, #FFE69C)',
  '👶': 'linear-gradient(135deg, #FFE9F5, #FFC8E8)',
  '🌿': 'linear-gradient(135deg, #DFFBE3, #B8F0C0)',
  '📚': 'linear-gradient(135deg, #E5E7FF, #CBD5F0)',
  '🧹': 'linear-gradient(135deg, #E0F7F3, #ADE8D9)',
  '🔧': 'linear-gradient(135deg, #FFE6CC, #FFCC99)',
  '🍽️': 'linear-gradient(135deg, #FFE4E1, #FFC8C2)',
  '🐕': 'linear-gradient(135deg, #FFE8D6, #FFCBA4)',
  '🎨': 'linear-gradient(135deg, #FFF5E0, #FFEBC2)',
  '💻': 'linear-gradient(135deg, #DCEFFC, #B6DCF7)',
  '📊': 'linear-gradient(135deg, #E7E1FF, #C9BCF5)',
};

export default function MissionCard({ mission }: { mission: Mission }) {
  const bg = BG_COLORS[mission.emoji] || 'linear-gradient(135deg, #F0F0F0, #E0E0E0)';
  const typeBadge = mission.type === 'CDI' ? 'cdi' : mission.type === 'CDD' ? 'cdd' : 'pro';

  return (
    <Link href="/contact" className="mission-card">
      <div className="mission-img" style={{ background: bg }}>
        <span className="mission-emoji">{mission.emoji || '🎯'}</span>
        {mission.est_urgent && (
          <span className="badge-urgent">⚡ Urgent</span>
        )}
      </div>
      <div className="mission-body">
        <h3>{mission.titre}</h3>
        <p className="mission-meta">📍 {mission.ville} · ⏱ {mission.duree || '—'}</p>
        <div className="mission-bottom">
          <span className="mission-price">{mission.tarif} €</span>
          <span className={`mission-type ${typeBadge}`}>{mission.type}</span>
        </div>
      </div>
    </Link>
  );
}
