import Link from 'next/link';

// Maillage interne : liens contextuels à ancres riches vers les pages clés.
// Composant présentationnel (sans hook) → utilisable dans les pages client comme serveur.
const ALL_LINKS = [
  { href: '/missions',           label: 'Toutes les missions',            emoji: '🔎' },
  { href: '/auto-entrepreneurs', label: 'Trouver un auto-entrepreneur',   emoji: '🧾' },
  { href: '/publier-mission',    label: 'Publier une mission',            emoji: '📋' },
  { href: '/pros',               label: 'Recruter du personnel',          emoji: '💼' },
  { href: '/travailleurs',       label: 'Trouver un job étudiant',        emoji: '🎓' },
  { href: '/comment',            label: 'Comment ça marche',              emoji: '❓' },
  { href: '/offres',             label: 'Offres & tarifs',                emoji: '⭐' },
  { href: '/classement',         label: 'Classement des travailleurs',    emoji: '🏆' },
];

export default function MaillageLinks({
  current,
  title = 'Explorer Jobici',
}: {
  current?: string;
  title?: string;
}) {
  const links = ALL_LINKS.filter((l) => l.href !== current);

  return (
    <section style={{ background: 'var(--cream)', borderTop: '1px solid var(--border)', padding: '40px 0' }}>
      <div className="container">
        <h2
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--navy)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 16,
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'white',
                border: '1px solid var(--border)',
                color: 'var(--navy)',
                padding: '10px 16px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span aria-hidden>{l.emoji}</span>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
