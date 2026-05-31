'use client';

import { reopenCookieBanner } from './CookieBanner';

export default function CookieButton() {
  return (
    <li>
      <button
        onClick={reopenCookieBanner}
        style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'left',
        }}
      >
        Gérer mes cookies
      </button>
    </li>
  );
}
