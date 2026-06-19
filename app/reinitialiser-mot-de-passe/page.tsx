'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validSession, setValidSession] = useState<boolean | null>(null);

  // Vérifier que l'utilisateur a une session valide (depuis le lien email)
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    }
    checkSession();

    // Écouter les changements de session (le lien email crée une session)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setValidSession(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validations (règles de robustesse : 8 car. min, 1 majuscule, 1 chiffre)
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Le mot de passe doit contenir au moins une majuscule.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins un chiffre.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { data: updated, error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // Si c'est un compte professionnel invité par l'admin, on l'active.
    // (sans effet pour les autres comptes : aucune ligne professionals → no-op)
    if (updated?.user?.id) {
      await supabase
        .from('professionals')
        .update({ status: 'active' })
        .eq('id', updated.user.id)
        .eq('status', 'invited');
    }

    setLoading(false);
    setSuccess(true);

    // Rediriger vers la connexion après 3 secondes
    setTimeout(() => {
      router.push('/connexion');
    }, 3000);
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

          {validSession === null ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Vérification en cours...
            </p>
          ) : !validSession ? (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 50, display: 'block', marginBottom: 16 }}>⚠️</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy)', marginBottom: 12 }}>
                Lien invalide ou expiré
              </h2>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Le lien de réinitialisation a expiré ou est invalide. Veuillez faire une nouvelle demande.
              </p>
              <Link href="/mot-de-passe-oublie" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
                Demander un nouveau lien →
              </Link>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 60, display: 'block', marginBottom: 16 }}>✅</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy)', marginBottom: 12 }}>
                Mot de passe modifié !
              </h2>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          ) : (
            <>
              <span style={{ fontSize: 50, display: 'block', textAlign: 'center', marginBottom: 16 }}>🔑</span>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--navy)', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>
                Nouveau mot de passe
              </h1>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
                Choisissez un nouveau mot de passe sécurisé pour votre compte Jobici.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères, 1 majuscule, 1 chiffre"
                  style={inputStyle}
                  autoComplete="new-password"
                />

                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="Tapez à nouveau"
                  style={inputStyle}
                  autoComplete="new-password"
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
                  {loading ? 'Modification...' : 'Modifier mon mot de passe'}
                </button>
              </form>
            </>
          )}
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