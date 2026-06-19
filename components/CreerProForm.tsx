'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'Document';

const SECTEURS = [
  '', 'Restauration', 'Commerce / Boutique', 'Artisanat / BTP', 'Coiffure / Esthétique',
  'Hôtellerie', 'Services à la personne', 'Logistique / Transport', 'Événementiel', 'Autre',
];

type DocItem = { path: string; name: string };

export default function CreerProForm({
  onResult,
}: {
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [raisonSociale, setRaisonSociale] = useState('');
  const [siret, setSiret] = useState('');
  const [secteur, setSecteur] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [contactPrenom, setContactPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');

  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRaisonSociale(''); setSiret(''); setSecteur('');
    setContactNom(''); setContactPrenom(''); setEmail('');
    setTelephone(''); setAdresse(''); setDocuments([]);
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    const valid = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    for (const file of files) {
      if (!valid.includes(file.type)) { setError('Formats acceptés : JPG, PNG, PDF.'); continue; }
      if (file.size > 5 * 1024 * 1024) { setError(`"${file.name}" dépasse 5 MB.`); continue; }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `professionals/pending/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) { setError('Erreur upload : ' + upErr.message); continue; }
      setDocuments(prev => [...prev, { path, name: file.name }]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!raisonSociale.trim()) { setError('La raison sociale est obligatoire.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Email invalide.'); return; }

    setLoading(true);
    const { data, error: fnErr } = await supabase.functions.invoke('admin-create-pro', {
      body: {
        raisonSociale: raisonSociale.trim(),
        siret: siret.trim(),
        secteur,
        contactNom: contactNom.trim(),
        contactPrenom: contactPrenom.trim(),
        email: email.trim().toLowerCase(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        documents: documents.map(d => d.path),
      },
    });
    setLoading(false);

    const errMsg = fnErr?.message || (data && (data as { error?: string }).error);
    if (errMsg) { setError(errMsg); onResult('error', errMsg); return; }

    onResult('success', `✅ Invitation envoyée à ${email.trim()}. Le professionnel va recevoir un email pour définir son mot de passe.`);
    reset();
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)', marginBottom: 6 }}>
        🏢 Créer un compte Professionnel
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Le professionnel recevra un email d'invitation pour définir son mot de passe et activer son compte.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Raison sociale *" value={raisonSociale} onChange={setRaisonSociale} placeholder="Ex : Boulangerie Dupont SARL" />
        <Field label="SIRET" value={siret} onChange={setSiret} placeholder="14 chiffres" />
      </div>

      <label style={labelStyle}>Secteur d'activité</label>
      <select value={secteur} onChange={e => setSecteur(e.target.value)} style={inputStyle}>
        {SECTEURS.map(s => <option key={s} value={s}>{s || '— Sélectionner —'}</option>)}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Prénom du contact" value={contactPrenom} onChange={setContactPrenom} placeholder="Prénom" />
        <Field label="Nom du contact" value={contactNom} onChange={setContactNom} placeholder="Nom" />
      </div>

      <Field label="Email (identifiant de connexion) *" value={email} onChange={setEmail} placeholder="contact@entreprise.fr" type="email" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Téléphone" value={telephone} onChange={setTelephone} placeholder="06 XX XX XX XX" type="tel" />
        <Field label="Adresse" value={adresse} onChange={setAdresse} placeholder="Ville / adresse" />
      </div>

      {/* Documents */}
      <label style={labelStyle}>Documents (KBIS, attestation…)</label>
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', color: 'var(--text-mid)' }}>
        {uploading ? '⏳ Upload en cours…' : '📎 Ajouter un document (JPG, PNG, PDF — max 5 MB)'}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" multiple
        style={{ display: 'none' }} onChange={handleFiles} />

      {documents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {documents.map((d, i) => (
            <div key={d.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 600 }}>📄 {d.name}</span>
              <button type="button" onClick={() => setDocuments(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--urgent)', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 16, fontWeight: 600 }}>
          ❌ {error}
        </div>
      )}

      <button type="submit" disabled={loading || uploading}
        style={{ width: '100%', background: 'var(--teal)', color: 'var(--navy)', padding: 14, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 24, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Création en cours…' : '📨 Créer le compte et envoyer l\'invitation'}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit', boxSizing: 'border-box',
};
