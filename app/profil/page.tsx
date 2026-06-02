'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

const BUCKET = 'Document';

const METIERS = [
  '', 'Plomberie', 'Électricité', 'Menuiserie', 'Jardinage', 'Ménage',
  'Peinture', 'Informatique', 'Livraison', 'Cours particuliers', 'Autre',
];

export default function ProfilPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, logout, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profil' | 'missions'>('profil');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  // Missions publiées
  type MissionPub = { id: string; titre: string; statut: string; statut_paiement: string | null; montant_paye: number | null; created_at: string; ville: string; tarif: number };
  const [missions, setMissions] = useState<MissionPub[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Champs communs
  const [nom, setNom]     = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');

  // Champs auto-entrepreneur
  const [metier, setMetier]             = useState('');
  const [bio, setBio]                   = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [telephone, setTelephone]       = useState('');

  // Profil travailleur
  const [experiences, setExperiences] = useState('');
  const [cvUrl, setCvUrl]             = useState<string | null>(null);
  const [lettreUrl, setLettreUrl]     = useState<string | null>(null);

  // Documents
  const [cniUrl, setCniUrl]                         = useState<string | null>(null);
  const [carteVitaleUrl, setCarteVitaleUrl]         = useState<string | null>(null);
  const [kbisUrl, setKbisUrl]                       = useState<string | null>(null);
  const [autorisationUrl, setAutorisationUrl]       = useState<string | null>(null);
  const [cniResponsableUrl, setCniResponsableUrl]   = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc]             = useState<string | null>(null);
  const [uploadError, setUploadError]               = useState('');

  const cvInputRef           = useRef<HTMLInputElement>(null);
  const lettreInputRef       = useRef<HTMLInputElement>(null);
  const cniInputRef          = useRef<HTMLInputElement>(null);
  const vitaleInputRef       = useRef<HTMLInputElement>(null);
  const kbisInputRef         = useRef<HTMLInputElement>(null);
  const autorisationInputRef = useRef<HTMLInputElement>(null);
  const cniResponsableRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/connexion'); return; }
    if (userProfile) {
      setNom(userProfile.nom || '');
      setVille(userProfile.ville || '');
      setAdresse(userProfile.adresse || '');
      setMetier(userProfile.metier || '');
      setBio(userProfile.bio || '');
      setEmailContact(userProfile.email_contact || '');
      setTelephone(userProfile.telephone || '');
      setCniUrl(userProfile.carte_identite_url || null);
      setCarteVitaleUrl(userProfile.carte_vitale_url || null);
      setKbisUrl(userProfile.kbis_url || null);
      setAutorisationUrl(userProfile.autorisation_parentale_url || null);
      setCniResponsableUrl(userProfile.cni_responsable_url || null);
      setExperiences(userProfile.experiences || '');
      setCvUrl(userProfile.cv_url || null);
      setLettreUrl(userProfile.lettre_motivation_url || null);
    }
  }, [authLoading, user, userProfile, router]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const base = {
      nom: nom.trim(),
      ville: ville.trim(),
      adresse: adresse.trim(),
      avatar_lettre: nom.trim().charAt(0).toUpperCase(),
    };

    const autoFields = userProfile?.statut === 'autoentrepreneur' ? {
      metier: metier.trim(),
      bio: bio.trim(),
      email_contact: emailContact.trim(),
      telephone: telephone.trim(),
    } : {};

    const workerFields = userProfile?.statut === 'worker' ? {
      experiences: experiences.trim(),
    } : {};

    const { error } = await supabase
      .from('profiles')
      .update({ ...base, ...autoFields, ...workerFields })
      .eq('id', user.id);

    setSaving(false);
    if (error) { alert('❌ Erreur : ' + error.message); return; }
    setEditing(false);
    await refreshProfile();
    alert('✅ Profil mis à jour !');
  }

  async function loadMissions() {
    if (!user) return;
    setLoadingMissions(true);
    const { data } = await supabase
      .from('missions')
      .select('id, titre, statut, statut_paiement, montant_paye, created_at, ville, tarif')
      .eq('employeur_id', user.id)
      .order('created_at', { ascending: false });
    setMissions((data ?? []) as MissionPub[]);
    setLoadingMissions(false);
  }

  async function supprimerMission(missionId: string, avecRemboursement: boolean) {
    if (!user) return;
    setDeletingId(missionId);
    if (avecRemboursement) {
      const res = await fetch('/api/missions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, userId: user.id }),
      });
      const data = await res.json();
      if (data.error) { alert('❌ ' + data.error); setDeletingId(null); return; }
      alert('✅ Mission supprimée et remboursement en cours.');
    } else {
      await supabase.from('missions').delete().eq('id', missionId);
    }
    setDeletingId(null);
    loadMissions();
  }

  type DocType = 'cni' | 'vitale' | 'kbis' | 'autorisation' | 'cni_responsable' | 'cv' | 'lettre';

  const DOC_CONFIG: Record<DocType, { column: string; fileName: string; setter: (v: string) => void }> = {
    cni:             { column: 'carte_identite_url',         fileName: 'carte_identite',          setter: setCniUrl },
    vitale:          { column: 'carte_vitale_url',           fileName: 'carte_vitale',            setter: setCarteVitaleUrl },
    kbis:            { column: 'kbis_url',                   fileName: 'kbis',                    setter: setKbisUrl },
    autorisation:    { column: 'autorisation_parentale_url', fileName: 'autorisation_parentale',  setter: setAutorisationUrl },
    cni_responsable: { column: 'cni_responsable_url',        fileName: 'cni_responsable',         setter: setCniResponsableUrl },
    cv:              { column: 'cv_url',                     fileName: 'cv',                      setter: setCvUrl },
    lettre:          { column: 'lettre_motivation_url',      fileName: 'lettre_motivation',       setter: setLettreUrl },
  };

  async function uploadDocument(file: File, type: DocType) {
    if (!user) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) { setUploadError('Format non supporté. Utilisez JPG, PNG ou PDF.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Fichier trop volumineux. Maximum 5 MB.'); return; }

    setUploadError('');
    setUploadingDoc(type);

    const cfg = DOC_CONFIG[type];
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${cfg.fileName}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
    if (uploadErr) {
      setUploadError('Erreur upload : ' + uploadErr.message);
      setUploadingDoc(null);
      return;
    }

    await supabase.from('profiles').update({ [cfg.column]: fileName }).eq('id', user.id);
    cfg.setter(fileName);

    // Vérifier si documents complets selon le statut
    const { data: prof } = await supabase
      .from('profiles')
      .select('carte_identite_url, carte_vitale_url, kbis_url, statut, statut_validation, autorisation_parentale_url, cni_responsable_url')
      .eq('id', user.id).single();

    if (prof) {
      let complets = false;
      if (prof.statut === 'worker') {
        const isMineur = prof.statut_validation === 'en_attente_parental';
        complets = isMineur
          ? !!(prof.carte_identite_url && prof.carte_vitale_url && prof.autorisation_parentale_url && prof.cni_responsable_url)
          : !!(prof.carte_identite_url && prof.carte_vitale_url);
      } else if (prof.statut === 'particulier' || prof.statut === 'autoentrepreneur') {
        complets = !!prof.carte_identite_url;
      } else if (prof.statut === 'employer') {
        complets = !!prof.kbis_url;
      }
      await supabase.from('profiles').update({ documents_complets: complets }).eq('id', user.id);
    }

    setUploadingDoc(null);
    await refreshProfile();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: DocType) {
    const file = e.target.files?.[0];
    if (file) uploadDocument(file, type);
  }

  async function voirDocument(path: string) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  if (authLoading) return (
    <><Header />
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
    </div><Footer /></>
  );
  if (!user) return null;

  const initial       = (userProfile?.nom || user.email || '?').charAt(0).toUpperCase();
  const isWorker      = userProfile?.statut === 'worker';
  const isAuto        = userProfile?.statut === 'autoentrepreneur';
  const isPro         = userProfile?.statut === 'employer' || isAuto;

  return (
    <>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

        {/* EN-TÊTE */}
        <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', borderRadius: 20, padding: 32, color: 'white', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--teal)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900 }}>
              {initial}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{userProfile?.nom || 'Mon compte'}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 6 }}>{user.email}</p>
              <span style={{ display: 'inline-block', background: 'var(--teal-light)', color: 'var(--teal)', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                {isWorker && '🎓 Travailleur'}
                {userProfile?.statut === 'particulier' && '🏠 Particulier'}
                {isAuto && '🧾 Auto-entrepreneur'}
                {userProfile?.statut === 'employer' && '🏢 Professionnelle'}
              </span>
            </div>
          </div>
        </div>

        {/* ONGLETS */}
        {(userProfile?.statut === 'particulier' || userProfile?.statut === 'employer') && (
          <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 12, padding: 6, border: '1px solid var(--border)', marginBottom: 24 }}>
            {(['profil', 'missions'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'missions') loadMissions(); }}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none', borderRadius: 8,
                  background: activeTab === tab ? 'var(--navy)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-mid)',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {tab === 'profil' ? '👤 Mon profil' : '📋 Mes publications'}
              </button>
            ))}
          </div>
        )}

        {/* ONGLET MISSIONS */}
        {activeTab === 'missions' && (
          <div>
            {loadingMissions ? (
              <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>
            ) : missions.length === 0 ? (
              <div className="empty-state">
                <span className="big-emoji">📋</span>
                <h3>Aucune mission publiée</h3>
                <Link href="/publier-mission" style={{ color: 'var(--teal)', fontWeight: 700, marginTop: 12, display: 'inline-block' }}>
                  Publier une mission →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {missions.map(m => {
                  const isPending = m.statut === 'en_attente_paiement';
                  const isPaid = m.statut_paiement === 'paye';
                  return (
                    <div key={m.id} style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid var(--border)', borderLeft: `4px solid ${isPending ? '#F59E0B' : m.statut === 'active' ? '#10B981' : '#CBD5E1'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{m.titre}</h3>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {m.ville} · {new Date(m.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: isPending ? '#FEF3C7' : '#D1FAE5', color: isPending ? '#92400E' : '#065F46' }}>
                            {isPending ? '⏳ Paiement en attente' : '✅ Active'}
                          </span>
                          {m.montant_paye && <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{m.montant_paye}€ {isPaid ? 'payé' : 'à payer'}</p>}
                        </div>
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/missions`} style={{ ...btnSmallStyle, background: 'var(--cream)', color: 'var(--navy)', textDecoration: 'none', border: '1px solid var(--border)' }}>
                          Voir →
                        </Link>
                        <button
                          onClick={() => {
                            if (!confirm(`Supprimer "${m.titre}" ?${isPaid ? '\n\nVous serez remboursé automatiquement.' : ''}`)) return;
                            supprimerMission(m.id, isPaid);
                          }}
                          disabled={deletingId === m.id}
                          style={{ ...btnSmallStyle, background: '#FEE2E2', color: '#991B1B', border: 'none', opacity: deletingId === m.id ? 0.5 : 1 }}
                        >
                          {deletingId === m.id ? '⏳' : isPaid ? '🔄 Supprimer & rembourser' : '🗑️ Supprimer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <Link href="/publier-mission" style={{ display: 'block', textAlign: 'center', padding: '14px', background: 'var(--teal)', color: 'var(--navy)', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', marginTop: 8 }}>
                  + Publier une nouvelle mission
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profil' && (
        <div>

        {/* VALIDATION SIRET */}
        {isPro && userProfile?.statut_validation === 'en_attente_siret' && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>⏳ Vérification SIRET en cours</h3>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>Votre SIRET est en cours de vérification. Vous pourrez publier des missions dès validation (sous 48h).</p>
          </div>
        )}

        {/* DOCUMENTS TRAVAILLEURS */}
        {isWorker && (!cniUrl || !carteVitaleUrl) && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>⚠️ Documents manquants</h3>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>Vous devez ajouter votre carte d'identité et votre carte vitale pour postuler.</p>
          </div>
        )}
        {isWorker && cniUrl && carteVitaleUrl && (
          <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal-dark)', marginBottom: 4 }}>✅ Documents complets</h3>
            <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>Vous pouvez postuler à toutes les missions.</p>
          </div>
        )}

        {/* INFORMATIONS GÉNÉRALES */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>📝 Informations</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={btnSecondaryStyle}>Modifier</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditing(false); }} style={btnSecondaryStyle}>Annuler</button>
                <button onClick={handleSave} disabled={saving} style={btnPrimaryStyle}>{saving ? '...' : 'Enregistrer'}</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Nom complet" value={nom} editing={editing} onChange={setNom} />
            <Field label="Email" value={user.email || ''} editing={false} onChange={() => {}} />
            <Field label="Ville" value={ville} editing={editing} onChange={setVille} />
            {userProfile?.statut === 'particulier' && (
              <Field label="Adresse" value={adresse} editing={editing} onChange={setAdresse} />
            )}
            {isAuto && (
              <Field label="SIRET" value={userProfile?.siret || '—'} editing={false} onChange={() => {}} />
            )}
            {userProfile?.statut === 'employer' && (
              <>
                <Field label="Entreprise" value={userProfile?.nom_entreprise || '—'} editing={false} onChange={() => {}} />
                <Field label="SIRET" value={userProfile?.siret || '—'} editing={false} onChange={() => {}} />
                <Field label="Forme juridique" value={userProfile?.forme_juridique || '—'} editing={false} onChange={() => {}} />
                <Field label="TVA intracom." value={userProfile?.tva || '—'} editing={false} onChange={() => {}} />
              </>
            )}
          </div>
        </div>

        {/* PROFIL AUTO-ENTREPRENEUR */}
        {isAuto && (
          <div style={{ ...cardStyle, border: '1.5px solid var(--teal-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>🧾 Profil public</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Ces infos sont visibles par les pros et particuliers sur votre profil.
                </p>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} style={btnSecondaryStyle}>Modifier</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Métier */}
              <div>
                <label style={labelStyle}>Métier / Activité</label>
                {editing ? (
                  <select
                    value={metier}
                    onChange={e => setMetier(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">— Sélectionner —</option>
                    {METIERS.filter(m => m !== '').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <p style={valueStyle}>{metier || '—'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label style={labelStyle}>Présentation (bio)</label>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Décrivez votre activité, vos compétences, votre expérience…"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                ) : (
                  <p style={{ ...valueStyle, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{bio || '—'}</p>
                )}
              </div>

              {/* Email de contact */}
              <div>
                <label style={labelStyle}>Email de contact direct</label>
                {editing ? (
                  <input
                    type="email"
                    value={emailContact}
                    onChange={e => setEmailContact(e.target.value)}
                    placeholder="exemple@email.com"
                    style={inputStyle}
                  />
                ) : (
                  <p style={valueStyle}>{emailContact || '—'}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label style={labelStyle}>Téléphone de contact direct</label>
                {editing ? (
                  <input
                    type="tel"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    style={inputStyle}
                  />
                ) : (
                  <p style={valueStyle}>{telephone || '—'}</p>
                )}
              </div>

            </div>

            {/* CTA pack visibilité */}
            <div style={{ marginTop: 20, background: 'var(--teal-light)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⭐</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>Activez le contact direct</p>
                <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>Avec le Pack Visibilité, votre profil est mis en avant et les clients peuvent vous contacter directement.</p>
              </div>
              <Link href="/offres" style={{ background: 'var(--teal)', color: 'var(--navy)', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                9,99 €/mois →
              </Link>
            </div>
          </div>
        )}

        {/* PROFIL TRAVAILLEUR */}
        {isWorker && (
          <div style={{ ...cardStyle, border: '1.5px solid var(--teal-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>💼 Mon profil travailleur</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Visible par les pros quand vous postulez.</p>
              </div>
              {!editing && <button onClick={() => setEditing(true)} style={btnSecondaryStyle}>Modifier</button>}
            </div>

            <label style={labelStyle}>Expériences & compétences</label>
            {editing ? (
              <textarea
                value={experiences}
                onChange={e => setExperiences(e.target.value)}
                placeholder="Décrivez vos expériences, compétences et disponibilités…"
                rows={5}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' as const }}
              />
            ) : (
              <p style={{ fontSize: 14, color: experiences ? 'var(--text-dark)' : 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {experiences || 'Aucune expérience renseignée.'}
              </p>
            )}

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📄</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>CV</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cvUrl ? '✅ Déposé' : 'Non déposé'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {cvUrl && <button onClick={() => voirDocument(cvUrl)} style={{ ...btnSecondaryStyle, fontSize: 12, padding: '6px 12px' }}>Voir</button>}
                  <button onClick={() => cvInputRef.current?.click()} style={{ ...btnPrimaryStyle, fontSize: 12, padding: '6px 12px' }}>
                    {uploadingDoc === 'cv' ? '⏳' : cvUrl ? 'Remplacer' : 'Déposer'}
                  </button>
                  <input ref={cvInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'cv')} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>✉️</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Lettre de motivation</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lettreUrl ? '✅ Déposée' : 'Non déposée'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {lettreUrl && <button onClick={() => voirDocument(lettreUrl)} style={{ ...btnSecondaryStyle, fontSize: 12, padding: '6px 12px' }}>Voir</button>}
                  <button onClick={() => lettreInputRef.current?.click()} style={{ ...btnPrimaryStyle, fontSize: 12, padding: '6px 12px' }}>
                    {uploadingDoc === 'lettre' ? '⏳' : lettreUrl ? 'Remplacer' : 'Déposer'}
                  </button>
                  <input ref={lettreInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'lettre')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {(isWorker || userProfile?.statut === 'particulier' || isAuto || userProfile?.statut === 'employer') && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>📄 Mes documents</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20, lineHeight: 1.6 }}>
              {isWorker ? 'Obligatoires pour postuler.' : 'Obligatoires pour publier une annonce.'} Stockés de manière sécurisée. Formats : JPG, PNG, PDF (max 5 MB).
            </p>

            {/* Travailleur : CNI + carte vitale (+ mineur) */}
            {isWorker && <>
              <DocumentUpload icon="🪪" label="Carte d'identité recto-verso" uploaded={!!cniUrl} uploading={uploadingDoc === 'cni'}
                onUpload={() => cniInputRef.current?.click()} onView={() => cniUrl && voirDocument(cniUrl)} />
              <input ref={cniInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'cni')} />

              <DocumentUpload icon="💳" label="Carte vitale" uploaded={!!carteVitaleUrl} uploading={uploadingDoc === 'vitale'}
                onUpload={() => vitaleInputRef.current?.click()} onView={() => carteVitaleUrl && voirDocument(carteVitaleUrl)} />
              <input ref={vitaleInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'vitale')} />

              {userProfile?.statut_validation === 'en_attente_parental' && <>
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', fontWeight: 600, margin: '12px 0 8px' }}>
                  ⚠️ Documents supplémentaires requis pour les mineurs
                </div>
                <DocumentUpload icon="📝" label="Autorisation parentale" uploaded={!!autorisationUrl} uploading={uploadingDoc === 'autorisation'}
                  onUpload={() => autorisationInputRef.current?.click()} onView={() => autorisationUrl && voirDocument(autorisationUrl)} />
                <input ref={autorisationInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'autorisation')} />

                <DocumentUpload icon="🪪" label="Carte d'identité du responsable légal" uploaded={!!cniResponsableUrl} uploading={uploadingDoc === 'cni_responsable'}
                  onUpload={() => cniResponsableRef.current?.click()} onView={() => cniResponsableUrl && voirDocument(cniResponsableUrl)} />
                <input ref={cniResponsableRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'cni_responsable')} />
              </>}
            </>}

            {/* Particulier + Auto-entrepreneur : CNI */}
            {(userProfile?.statut === 'particulier' || isAuto) && <>
              <DocumentUpload icon="🪪" label="Carte d'identité recto-verso" uploaded={!!cniUrl} uploading={uploadingDoc === 'cni'}
                onUpload={() => cniInputRef.current?.click()} onView={() => cniUrl && voirDocument(cniUrl)} />
              <input ref={cniInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'cni')} />
            </>}

            {/* Professionnel : Kbis */}
            {userProfile?.statut === 'employer' && <>
              <DocumentUpload icon="📋" label="Extrait Kbis (moins de 3 mois)" uploaded={!!kbisUrl} uploading={uploadingDoc === 'kbis'}
                onUpload={() => kbisInputRef.current?.click()} onView={() => kbisUrl && voirDocument(kbisUrl)} />
              <input ref={kbisInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'kbis')} />
            </>}

            {uploadError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 12, fontWeight: 600 }}>
                ❌ {uploadError}
              </div>
            )}

            {userProfile?.documents_complets && (
              <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--teal-dark)', fontWeight: 700, marginTop: 12 }}>
                ✅ Documents complets — vous pouvez {isWorker ? 'postuler aux missions' : 'publier des annonces'}.
              </div>
            )}
          </div>
        )}

        {/* CLASSEMENT XP (Travailleurs) */}
        {isWorker && (
          <Link href="/classement" style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, cursor: 'pointer', background: 'linear-gradient(135deg, var(--teal-light), var(--cream))', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 40, flexShrink: 0 }}>🏆</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Voir le classement XP</h3>
                <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>Découvrez votre position et grimpez les rangs !</p>
                {userProfile?.xp_total !== undefined && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-mid)' }}>
                    <span>⭐ <strong style={{ color: 'var(--teal-dark)' }}>{userProfile?.xp_total || 0}</strong> XP</span>
                    <span>🎖️ Niveau <strong style={{ color: 'var(--teal-dark)' }}>{userProfile?.niveau || 1}</strong></span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 18, color: 'var(--teal)' }}>→</span>
            </div>
          </Link>
        )}

        {/* ACTIONS RAPIDES (Pros) */}
        {isPro && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>⚡ Actions rapides</h2>
            <Link href="/publier-mission" style={{ ...btnPrimaryStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>📋 Publier une nouvelle mission</Link>
            <Link href="/missions" style={{ ...btnSecondaryStyle, display: 'block', textAlign: 'center', textDecoration: 'none' }}>🎯 Voir toutes les missions</Link>
          </div>
        )}

        {/* DÉCONNEXION */}
        <div style={cardStyle}>
          <button
            onClick={async () => { if (confirm('Voulez-vous vraiment vous déconnecter ?')) { await logout(); router.push('/'); } }}
            style={{ width: '100%', background: 'transparent', color: 'var(--urgent)', border: '1.5px solid var(--urgent)', padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🚪 Se déconnecter
          </button>
        </div>

        </div>
        )}

      </main>
      <Footer />
    </>
  );
}

function Field({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {editing
        ? <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
        : <p style={valueStyle}>{value || '—'}</p>
      }
    </div>
  );
}

function DocumentUpload({ icon, label, uploaded, uploading, onUpload, onView }: { icon: string; label: string; uploaded: boolean; uploading: boolean; onUpload: () => void; onView: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--cream)', border: `1.5px solid ${uploaded ? 'var(--teal-border)' : 'var(--border)'}`, borderRadius: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: uploaded ? 'var(--teal-dark)' : 'var(--text-muted)', fontWeight: 600 }}>{uploaded ? '✓ Document ajouté' : 'Aucun document'}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {uploaded && <button onClick={onView} style={btnSecondaryStyle}>👁️ Voir</button>}
        <button onClick={onUpload} disabled={uploading} style={btnPrimaryStyle}>{uploading ? '...' : uploaded ? 'Remplacer' : 'Téléverser'}</button>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 };
const valueStyle: React.CSSProperties = { fontSize: 15, color: 'var(--text-dark)', fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: 'var(--cream)', outline: 'none', boxSizing: 'border-box' };
const btnPrimaryStyle: React.CSSProperties = { background: 'var(--teal)', color: 'var(--navy)', padding: '8px 16px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondaryStyle: React.CSSProperties = { background: 'transparent', color: 'var(--navy)', padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const btnSmallStyle: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
