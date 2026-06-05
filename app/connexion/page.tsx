'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError(error.message);
      }
      return;
    }

    router.push('/');
  }

  return (
    <>
      <Header />

      <section style={{ background: 'var(--cream)', padding: '60px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', border: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--navy)', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>
            Bienvenue 👋
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
            Connectez-vous à votre compte Jobici
          </p>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex@email.com"
              style={inputStyle}
              autoComplete="email"
            />

            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              autoComplete="current-password"
            />

            {error && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 16, fontWeight: 600 }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
          <Link href="/mot-de-passe-oublie" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600 }}>
            Mot de passe oublié ?
          </Link>
        </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 12 }}>
              Pas encore de compte ?
            </p>
            <Link href="/inscription" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
              Créer un compte →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)',
  marginBottom: 6, marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit',
};

const btnStyle: React.CSSProperties = {
  width: '100%', background: 'var(--teal)', color: 'var(--navy)', padding: 14,
  border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 24,
  fontFamily: 'inherit',
};
