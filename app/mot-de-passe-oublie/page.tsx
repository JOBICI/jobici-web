'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <>
      <Header />

      <section style={{
        background: 'var(--cream)', padding: '60px 20px',
        minHeight: '60vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'white', borderRadius: 20, padding: 40,
          maxWidth: 440, width: '100%', border: '1px solid var(--border)',
        }}>

          {!success ? (
            <>
              <span style={{ fontSize: 50, display: 'block', textAlign: 'center', marginBottom: 16 }}>🔑</span>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--navy)', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>
                Mot de passe oublié ?
              </h1>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
                Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  style={inputStyle}
                  autoComplete="email"
                />

                {error && (
                  <div style={errorBox}>❌ {error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...btnStyle,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Envoi en cours...' : 'Recevoir le lien'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <Link href="/connexion" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
                  ← Retour à la connexion
                </Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 60, display: 'block', marginBottom: 16 }}>📧</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy)', marginBottom: 12 }}>
                Email envoyé !
              </h2>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Si un compte existe avec l'email <strong style={{ color: 'var(--navy)' }}>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe dans quelques minutes.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Pensez à vérifier votre dossier <strong>Spam / Indésirables</strong> si vous ne voyez pas l'email.
              </p>
              <Link href="/connexion" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
                ← Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 6, marginTop: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)',
  borderRadius: 10, fontSize: 14, outline: 'none',
  background: 'var(--cream)', fontFamily: 'inherit',
};

const btnStyle: React.CSSProperties = {
  width: '100%', background: 'var(--teal)', color: 'var(--navy)',
  padding: 14, border: 'none', borderRadius: 12,
  fontWeight: 800, fontSize: 14, marginTop: 24, fontFamily: 'inherit',
};

const errorBox: React.CSSProperties = {
  background: '#FEE2E2', color: '#991B1B', padding: '12px 14px',
  borderRadius: 10, fontSize: 13, marginTop: 16, fontWeight: 600,
};