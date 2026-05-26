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
          fontSize: 'inherit', color: 'inherit', textAlign: 'left',
        }}
      >
        Gérer mes cookies
      </button>
    </li>
  );
}
