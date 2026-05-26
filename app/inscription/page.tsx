'use client';

import { useState, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const BUCKET = 'Document';

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeInitial = searchParams.get('type') || 'worker';

  // ─── État - Type ───
  const [statut, setStatut] = useState(typeInitial);

  // ─── État - Infos perso (tous) ───
  const [prenom, setPrenom]     = useState('');
  const [nom, setNom]           = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [age, setAge]           = useState('');
  const [ville, setVille]       = useState('');

  // ─── État - Parent (si mineur) ───
  const [prenomParent, setPrenomParent] = useState('');
  const [nomParent, setNomParent]       = useState('');
  const [telParent, setTelParent]       = useState('');
  const [emailParent, setEmailParent]   = useState('');
  const [autorisationFile, setAutorisationFile] = useState<File | null>(null);

  // ─── État - Documents (Worker / AE) ───
  const [cniFile, setCniFile]       = useState<File | null>(null);
  const [vitaleFile, setVitaleFile] = useState<File | null>(null);

  // ─── État - Auto-entrepreneur ───
  const [nomCommercial, setNomCommercial] = useState('');
  const [siret, setSiret]             = useState('');
  const [codeApe, setCodeApe]         = useState('');
  const [tva, setTva]                 = useState('');

  // ─── État - Professionnel ───
  const [nomEntreprise, setNomEntreprise]     = useState('');
  const [formeJuridique, setFormeJuridique]   = useState('');
  const [adresseSiege, setAdresseSiege]       = useState('');
  const [nomRepresentant, setNomRepresentant] = useState('');
  const [emailRep, setEmailRep]               = useState('');
  const [telRep, setTelRep]                   = useState('');

  // ─── État commun ───
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ─── Refs upload ───
  const cniRef = useRef<HTMLInputElement>(null);
  const vitaleRef = useRef<HTMLInputElement>(null);
  const autorisationRef = useRef<HTMLInputElement>(null);

  // ─── Calcul mineur ───
  const ageNum = parseInt(age) || 0;
  const estMineur = ageNum >= 14 && ageNum < 18;
  const estTropJeune = age !== '' && ageNum < 14;

  // ─── Helpers ───
  const isWorker = statut === 'worker';
  const isParticulier = statut === 'particulier';
  const isAutoEnt = statut === 'autoentrepreneur';
  const isPro = statut === 'employer';

  async function uploadFile(file: File, userId: string, type: 'cni' | 'vitale' | 'autorisation'): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = type === 'cni' ? 'carte_identite' :
                     type === 'vitale' ? 'carte_vitale' : 'autorisation_parentale';
    const path = `${userId}/${filename}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });

    if (upErr) {
      console.error('Erreur upload:', upErr);
      return null;
    }
    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // ─── VALIDATIONS COMMUNES ───
    if (!cguAcceptees) { setError("Vous devez accepter les CGU pour vous inscrire."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    // ─── VALIDATIONS PAR STATUT ───
    if (!prenom.trim() || !nom.trim()) { setError("Prénom et nom obligatoires."); return; }
    if (!telephone.trim()) { setError("Téléphone obligatoire."); return; }

    if (isWorker || isParticulier || isAutoEnt) {
      if (!age) { setError("Âge obligatoire."); return; }
      if (estTropJeune) { setError("⚠️ Vous devez avoir au moins 14 ans."); return; }
      if (!ville.trim()) { setError("Ville obligatoire."); return; }

      // Mineur : infos parent obligatoires
      if (estMineur) {
        if (!prenomParent.trim() || !nomParent.trim()) { setError("Prénom et nom du parent obligatoires."); return; }
        if (!telParent.trim()) { setError("Téléphone du parent obligatoire."); return; }
        if (!emailParent.trim()) { setError("Email du parent obligatoire."); return; }
      }
    }

    if (isAutoEnt) {
      if (!nomCommercial.trim()) { setError("Nom commercial obligatoire."); return; }
      if (!siret.trim() || !/^\d{14}$/.test(siret.replace(/\s/g, ''))) { setError("SIRET de 14 chiffres requis."); return; }
      if (!codeApe.trim()) { setError("Code APE obligatoire."); return; }
    }

    if (isPro) {
      if (!nomEntreprise.trim()) { setError("Nom de l'entreprise obligatoire."); return; }
      if (!siret.trim() || !/^\d{14}$/.test(siret.replace(/\s/g, ''))) { setError("SIRET de 14 chiffres requis."); return; }
      if (!formeJuridique.trim()) { setError("Forme juridique obligatoire."); return; }
      if (!adresseSiege.trim()) { setError("Adresse du siège obligatoire."); return; }
      if (!nomRepresentant.trim()) { setError("Nom du représentant obligatoire."); return; }
      if (!emailRep.trim()) { setError("Email du représentant obligatoire."); return; }
      if (!telRep.trim()) { setError("Téléphone du représentant obligatoire."); return; }
    }

    setLoading(true);

    // ─── CRÉATION DU COMPTE ───
    const fullName = `${prenom.trim()} ${nom.trim()}`;
    const userData: any = {
      nom: fullName,
      prenom: prenom.trim(),
      statut,
      telephone: telephone.trim(),
    };

    if (isWorker || isParticulier || isAutoEnt) {
      userData.age = ageNum;
      userData.ville = ville.trim();
      if (estMineur) {
        userData.statut_validation = 'en_attente_parental';
        userData.email_parent = emailParent.trim().toLowerCase();
        userData.nom_parent = `${prenomParent.trim()} ${nomParent.trim()}`;
        userData.tel_parent = telParent.trim();
      }
    }
    if (isAutoEnt) {
      userData.nom_commercial = nomCommercial.trim();
      userData.siret = siret.replace(/\s/g, '');
      userData.code_ape = codeApe.trim();
      if (tva.trim()) userData.tva = tva.trim().toUpperCase();
      userData.statut_validation = 'en_attente_siret';
    }
    if (isPro) {
      userData.nom_entreprise = nomEntreprise.trim();
      userData.siret = siret.replace(/\s/g, '');
      userData.forme_juridique = formeJuridique.trim();
      userData.adresse_siege = adresseSiege.trim();
      userData.nom_representant = nomRepresentant.trim();
      userData.email_representant = emailRep.trim().toLowerCase();
      userData.tel_representant = telRep.trim();
      if (tva.trim()) userData.tva = tva.trim().toUpperCase();
      userData.statut_validation = 'en_attente_siret';
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: userData },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.includes('already registered')) {
        setError("Cet email est déjà utilisé. Connectez-vous à la place.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // ─── UPLOAD DES DOCUMENTS si fournis ───
    const userId = data.user?.id;
    if (userId) {
      const updates: any = {};
      if (cniFile) {
        const path = await uploadFile(cniFile, userId, 'cni');
        if (path) updates.carte_identite_url = path;
      }
      if (vitaleFile) {
        const path = await uploadFile(vitaleFile, userId, 'vitale');
        if (path) updates.carte_vitale_url = path;
      }
      if (autorisationFile && estMineur) {
        const path = await uploadFile(autorisationFile, userId, 'autorisation');
        if (path) updates.autorisation_parentale_url = path;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', userId);
      }
    }

    setLoading(false);
    alert('✅ Compte créé !\n\nVérifiez vos emails pour confirmer votre inscription.');
    router.push('/connexion');
  }

  return (
    <div style={{ maxWidth: 720, width: '100%' }}>

      <h1 style={titreH1}>Je m'inscris en tant que</h1>

      {/* ─── CARTES DE TYPE ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { v: 'worker',           e: '🔍', t: 'Chercher un job',  d: 'Étudiant, salarié...' },
          { v: 'particulier',      e: '🏠', t: 'Particulier',       d: 'Proposer une mission' },
          { v: 'autoentrepreneur', e: '💼', t: 'Auto-entrepreneur', d: 'Proposer mes services' },
          { v: 'employer',         e: '🏢', t: 'Professionnel',     d: 'Recruter pour mon entreprise' },
        ].map(opt => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setStatut(opt.v)}
            style={{
              padding: 20,
              background: 'white',
              border: `2px solid ${statut === opt.v ? 'var(--teal)' : 'var(--border)'}`,
              borderRadius: 16,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{opt.e}</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: statut === opt.v ? 'var(--teal-dark)' : 'var(--navy)', marginBottom: 4 }}>
              {opt.t}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.d}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ──────────────── INFOS PERSONNELLES ──────────────── */}
        <Separator label="Informations personnelles" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Prénom" required value={prenom} onChange={setPrenom} placeholder="Prénom" />
          <Field label="Nom" required value={nom} onChange={setNom} placeholder="Nom" />
        </div>

        <Field label="Email" required value={email} onChange={setEmail} type="email" placeholder="votre@email.com" />
        <Field label="Mot de passe" required value={password} onChange={setPassword} type="password" placeholder="••••••" />
        <Field label="Téléphone" required value={telephone} onChange={setTelephone} type="tel" placeholder="06 XX XX XX XX" />

        {(isWorker || isParticulier || isAutoEnt) && (
          <>
            <Field label="Âge" required value={age} onChange={setAge} type="number" placeholder="Ex : 20" />
            {estTropJeune && (
              <div style={errorBox}>⚠️ Vous devez avoir au moins 14 ans pour vous inscrire.</div>
            )}
            <Field label="Ville" required value={ville} onChange={setVille} placeholder="Ex : Paris, Lyon..." />
          </>
        )}

        {/* ──────────────── INFOS PARENT (MINEUR) ──────────────── */}
        {estMineur && (isWorker || isParticulier || isAutoEnt) && (
          <>
            <div style={alertBox}>
              <p style={{ color: '#92400E', fontSize: 13, lineHeight: 1.6 }}>
                <strong>ℹ️ Vous êtes mineur(e) ({ageNum} ans).</strong><br/>
                Les informations de votre parent ou tuteur légal sont nécessaires pour valider votre compte.
              </p>
            </div>

            <Separator label="Informations du parent / tuteur" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prénom parent" required value={prenomParent} onChange={setPrenomParent} placeholder="Prénom" />
              <Field label="Nom parent" required value={nomParent} onChange={setNomParent} placeholder="Nom" />
            </div>

            <Field label="Téléphone parent" required value={telParent} onChange={setTelParent} type="tel" placeholder="06 XX XX XX XX" />
            <Field label="Email parent" required value={emailParent} onChange={setEmailParent} type="email" placeholder="parent@email.com" />

            <FileUpload
              label="Autorisation parentale"
              file={autorisationFile}
              onSelect={setAutorisationFile}
              inputRef={autorisationRef}
              optionalForNow={true}
              info="Obligatoire pour valider le compte. Peut être ajoutée plus tard."
              downloadLink={{
                url: '/documents/autorisation-parentale.pdf',
                label: '📥 Télécharger le modèle PDF',
              }}
            />
          </>
        )}

        {/* ──────────────── DOCUMENTS D'IDENTITÉ (Worker / AE) ──────────────── */}
        {(isWorker || isAutoEnt) && (
          <>
            <Separator label="Documents d'identité" />

            <FileUpload
              label="Carte d'identité"
              file={cniFile}
              onSelect={setCniFile}
              inputRef={cniRef}
              optionalForNow={true}
              info="Obligatoire pour valider le compte. Peut être ajoutée plus tard."
            />

            <FileUpload
              label="Carte vitale"
              file={vitaleFile}
              onSelect={setVitaleFile}
              inputRef={vitaleRef}
              optionalForNow={true}
              info="Obligatoire pour valider le compte. Peut être ajoutée plus tard."
            />
          </>
        )}

        {/* ──────────────── INFOS PRO (Auto-entrepreneur) ──────────────── */}
        {isAutoEnt && (
          <>
            <Separator label="Informations professionnelles" />

            <Field label="Nom commercial" required value={nomCommercial} onChange={setNomCommercial}
              placeholder="Ex : Dylan Services" info="Le nom sous lequel vous exercez." />

            <Field label="Numéro de SIRET" required value={siret} onChange={setSiret} placeholder="14 chiffres" />

            <Field label="Code APE" required value={codeApe} onChange={setCodeApe}
              placeholder="Ex : 7490B" info="Code de votre activité principale." />

            <Field label="Numéro TVA intracommunautaire" value={tva} onChange={setTva}
              placeholder="Ex : FR12345678901" info="Uniquement si vous êtes assujetti à la TVA." optional />
          </>
        )}

        {/* ──────────────── INFOS ENTREPRISE (Pro) ──────────────── */}
        {isPro && (
          <>
            <Separator label="Informations de l'entreprise" />

            <Field label="Nom de l'entreprise" required value={nomEntreprise} onChange={setNomEntreprise} placeholder="Ex : Dupont & Associés" />
            <Field label="Numéro de SIRET" required value={siret} onChange={setSiret} placeholder="14 chiffres" />
            <Field label="Forme juridique" required value={formeJuridique} onChange={setFormeJuridique} placeholder="Ex : SAS, SARL, EURL, SA..." />
            <Field label="Adresse du siège social" required value={adresseSiege} onChange={setAdresseSiege} placeholder="Ex : 12 rue de la Paix, 75001 Paris" />

            <Separator label="Représentant légal" />

            <Field label="Nom du représentant" required value={nomRepresentant} onChange={setNomRepresentant} placeholder="Prénom Nom" />
            <Field label="Email" required value={emailRep} onChange={setEmailRep} type="email" placeholder="representant@entreprise.com" />
            <Field label="Téléphone" required value={telRep} onChange={setTelRep} type="tel" placeholder="06 XX XX XX XX" />
            <Field label="Numéro TVA intracommunautaire" value={tva} onChange={setTva}
              placeholder="Ex : FR12345678901" info="Uniquement si vous êtes assujetti à la TVA." optional />
          </>
        )}

        {/* ─── ENCART PÉDAGOGIQUE ─── */}
        <div style={pedagoBox}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>📋</span>
          <p style={{ fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.6 }}>
            Les champs <strong style={{ color: 'var(--urgent)' }}>● Obligatoire pour valider</strong> peuvent être complétés plus tard, mais sont nécessaires pour activer votre compte.
          </p>
        </div>

        {/* ─── CGU ─── */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginTop: 20, padding: 16,
          background: 'white',
          border: `2px solid ${cguAcceptees ? 'var(--teal)' : 'var(--border)'}`,
          borderRadius: 12, cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={cguAcceptees}
            onChange={e => setCguAcceptees(e.target.checked)}
            style={{ marginTop: 3, width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 600, marginBottom: 4 }}>
              J'accepte les <Link href="/cgu" target="_blank" style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'underline' }}>conditions générales d'utilisation</Link> de Jobici
            </p>
            {!cguAcceptees && (
              <p style={{ fontSize: 12, color: 'var(--urgent)', fontWeight: 600 }}>
                ⚠️ Vous devez accepter les CGU pour créer votre compte
              </p>
            )}
          </div>
        </label>

        {error && <div style={errorBox}>❌ {error}</div>}

        <button
          type="submit"
          disabled={loading || estTropJeune || !cguAcceptees}
          style={{
            width: '100%',
            background: (loading || estTropJeune || !cguAcceptees) ? '#9CA3AF' : 'var(--navy)',
            color: 'white',
            padding: 18,
            border: 'none',
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 15,
            cursor: (loading || estTropJeune || !cguAcceptees) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            marginTop: 24,
            letterSpacing: 0.5,
          }}
        >
          {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
        </button>

        {/* ─── BESOIN D'AIDE ─── */}
        <div style={{
          marginTop: 24, padding: 18, background: 'var(--teal-light)',
          border: '1px solid var(--teal-border)', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>📞</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal-dark)', marginBottom: 2 }}>
              Besoin d'aide ?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-dark)' }}>
              Notre équipe vous accompagne : <a href="mailto:contact@job-ici.com" style={{ color: 'var(--teal-dark)', fontWeight: 700 }}>contact@job-ici.com</a>
            </p>
          </div>
        </div>

      </form>

      <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 8 }}>Déjà inscrit ?</p>
        <Link href="/connexion" style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14 }}>
          Se connecter →
        </Link>
      </div>
    </div>
  );
}

// ═══════════════ COMPOSANTS UTILITAIRES ═══════════════

function Separator({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required = false, optional = false, info }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; optional?: boolean; info?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </label>
        {required ? (
          <span style={{ fontSize: 12, color: 'var(--urgent)', fontWeight: 700 }}>
            ● Obligatoire
          </span>
        ) : optional ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            ○ Facultatif
          </span>
        ) : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '14px 16px', border: '1px solid var(--border)',
          borderRadius: 12, fontSize: 14, fontFamily: 'inherit', background: 'white', outline: 'none',
        }}
      />
      {info && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <span>ℹ️</span> {info}
        </p>
      )}
    </div>
  );
}

function FileUpload({ label, file, onSelect, inputRef, optionalForNow, info, downloadLink }: {
  label: string; file: File | null;
  onSelect: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  optionalForNow?: boolean; info?: string;
  downloadLink?: { url: string; label: string };
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </label>
        {optionalForNow && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            ○ Facultatif pour l'instant
          </span>
        )}
      </div>

      {downloadLink && (
        <a
          href={downloadLink.url}
          download
          style={{
            display: 'inline-block', marginBottom: 8, fontSize: 12,
            color: 'var(--teal-dark)', fontWeight: 700, textDecoration: 'underline',
          }}
        >
          {downloadLink.label}
        </a>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', padding: 24,
          border: `2px dashed ${file ? 'var(--teal)' : 'var(--border)'}`,
          background: file ? 'var(--teal-light)' : 'white',
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>📎</span>
        <span style={{ fontSize: 14, color: file ? 'var(--teal-dark)' : 'var(--text-mid)', fontWeight: 600 }}>
          {file ? `✓ ${file.name}` : 'Appuyer pour ajouter'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) {
            if (f.size > 5 * 1024 * 1024) {
              alert('Fichier trop volumineux (max 5 MB)');
              return;
            }
            onSelect(f);
          }
        }}
      />

      {info && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <span>ℹ️</span> {info}
        </p>
      )}
    </div>
  );
}

// ═══════════════ STYLES ═══════════════

const titreH1: React.CSSProperties = {
  fontSize: 28, fontWeight: 900, color: 'var(--navy)',
  marginBottom: 24, letterSpacing: -0.5,
};

const errorBox: React.CSSProperties = {
  background: '#FEE2E2', color: '#991B1B', padding: '12px 14px',
  borderRadius: 10, fontSize: 13, marginTop: 16, fontWeight: 600,
};

const alertBox: React.CSSProperties = {
  background: '#FEF3C7', border: '1px solid #FCD34D',
  padding: 16, borderRadius: 12, marginTop: 16,
};

const pedagoBox: React.CSSProperties = {
  background: 'var(--teal-light)', border: '1px solid var(--teal-border)',
  padding: 16, borderRadius: 12, marginTop: 24,
  display: 'flex', alignItems: 'flex-start', gap: 12,
};

export default function InscriptionPage() {
  return (
    <>
      <Header />
      <section style={{
        background: 'var(--cream)', padding: '40px 20px',
        minHeight: '60vh', display: 'flex', justifyContent: 'center',
      }}>
        <Suspense fallback={<div>Chargement...</div>}>
          <InscriptionForm />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
