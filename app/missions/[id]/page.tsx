'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Mission = {
  id: string;
  titre: string;
  description: string;
  ville: string;
  emoji: string;
  type: string;
  duree: string;
  date_mission: string;
  horaires: string;
  profil_requis: string;
  tarif: number;
  est_urgent: boolean;
  statut: string;
  employeur_id: string;
  created_at: string;
};

type Employeur = {
  nom: string | null;
  avatar_lettre: string | null;
  statut: string | null;
  ville: string | null;
};

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const missionId = params.id as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [employeur, setEmployeur] = useState<Employeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ── Charger la mission + l'employeur ──
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: m, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();

      if (error || !m) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setMission(m as Mission);

      // Charger l'employeur
      const { data: emp } = await supabase
        .from('profiles')
        .select('nom, avatar_lettre, statut, ville')
        .eq('id', m.employeur_id)
        .single();

      if (emp) setEmployeur(emp as Employeur);

      setLoading(false);
    }

    if (missionId) load();
  }, [missionId]);

  // ── Vérifier si déjà postulé ──
  useEffect(() => {
    async function checkApplied() {
      if (!user || !missionId) return;
      const { data } = await supabase
        .from('candidatures')
        .select('id')
        .eq('mission_id', missionId)
        .eq('travailleur_id', user.id)
        .maybeSingle();
      if (data) setAlreadyApplied(true);
    }
    checkApplied();
  }, [user, missionId]);

  // ── Postuler ──
  async function handlePostuler() {
    if (!user) {
      router.push('/connexion');
      return;
    }
    if (!mission) return;

    // Empêcher de postuler à sa propre mission
    if (user.id === mission.employeur_id) {
      alert("Vous ne pouvez pas postuler à votre propre mission.");
      return;
    }

    // Vérifier les documents
    if (!userProfile?.documents_complets) {
      alert("⚠️ Vous devez déposer vos documents dans votre profil avant de postuler (carte d'identité et carte vitale).");
      router.push('/profil');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Créer la candidature
      const { error: candError } = await supabase
        .from('candidatures')
        .insert({
          mission_id: mission.id,
          travailleur_id: user.id,
          employeur_id: mission.employeur_id,
          statut: 'en_attente',
          type: 'postulation',
          prix_propose: mission.tarif,
        });

      if (candError) {
        alert("Impossible de postuler : " + candError.message);
        setSubmitting(false);
        return;
      }

      // 2. Créer ou retrouver la conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('mission_id', mission.id)
        .eq('travailleur_id', user.id)
        .eq('employeur_id', mission.employeur_id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            mission_id: mission.id,
            travailleur_id: user.id,
            employeur_id: mission.employeur_id,
          })
          .select('id')
          .single();
        conversationId = newConv?.id;
      }

      // 3. Envoyer un premier message automatique
      if (conversationId) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://job-ici.com';
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          auteur_id: user.id,
          texte: `Bonjour, je suis intéressé(e) par votre mission "${mission.titre}". Je suis disponible !\n\n👤 Consultez mon profil (expériences, CV, lettre de motivation) : ${siteUrl}/profil/${user.id}`,
          type: 'normal',
        });
      }

      setAlreadyApplied(true);
      setSubmitting(false);

      alert(`✅ Candidature envoyée !\n\nVotre candidature pour "${mission.titre}" a été transmise. Vous pouvez maintenant échanger par message.`);
      router.push('/messages');

    } catch (err: any) {
      alert("Une erreur s'est produite. Réessayez plus tard.");
      setSubmitting(false);
    }
  }

  // ── États ──
  if (loading || authLoading) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chargement de la mission...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !mission) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
          <span style={{ fontSize: 60 }}>🔍</span>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy)' }}>Mission introuvable</h1>
          <p style={{ color: 'var(--text-mid)', textAlign: 'center' }}>Cette mission n'existe plus ou a été supprimée.</p>
          <Link href="/missions" style={{ color: 'var(--teal)', fontWeight: 700 }}>← Voir toutes les missions</Link>
        </div>
        <Footer />
      </>
    );
  }

  const isPro = employeur?.statut === 'employer' || employeur?.statut === 'autoentrepreneur';
  const isOwner = user?.id === mission.employeur_id;
  const isWorker = userProfile?.statut === 'worker' || userProfile?.statut === 'autoentrepreneur';

  return (
    <>
      <Header />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>

        <Link href="/missions" style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>
          ← Retour aux missions
        </Link>

        {/* ═══ EN-TÊTE MISSION ═══ */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid var(--border)', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--navy)', color: 'white', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
              {mission.emoji} MISSION
            </span>
            {mission.est_urgent && (
              <span style={{ background: 'var(--urgent)', color: 'white', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                🔥 URGENT
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--navy)', marginBottom: 12, letterSpacing: -0.5 }}>
            {mission.titre}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--teal-dark)' }}>
              {mission.tarif}€
            </span>
            {mission.duree && (
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>· {mission.duree}</span>
            )}
          </div>

          {/* Infos clés */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 8 }}>
            {mission.ville && <InfoBox icon="📍" label="Ville" value={mission.ville} />}
            {mission.date_mission && <InfoBox icon="📅" label="Date" value={mission.date_mission} />}
            {mission.horaires && <InfoBox icon="🕐" label="Horaires" value={mission.horaires} />}
            {mission.profil_requis && <InfoBox icon="👤" label="Profil" value={mission.profil_requis} />}
          </div>
        </div>

        {/* ═══ DESCRIPTION ═══ */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>📋 Description</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
            {mission.description || "Aucune description fournie. Contactez l'employeur pour plus d'informations."}
          </p>
        </div>

        {/* ═══ EMPLOYEUR ═══ */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>L'employeur</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--teal)', color: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, flexShrink: 0,
            }}>
              {employeur?.avatar_lettre || (employeur?.nom || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>
                {employeur?.nom || 'Employeur'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                {isPro ? '🏢 Professionnel' : '🏠 Particulier'}
                {employeur?.ville && ` · 📍 ${employeur.ville}`}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ INFO PAIEMENT ═══ */}
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 14, padding: 18, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--teal-dark)', lineHeight: 1.6 }}>
            🔒 <strong>Paiement sécurisé</strong> — Le montant est bloqué à l'acceptation et versé après validation de la mission. 0% de commission pour vous en tant que travailleur.
          </p>
        </div>

        {/* ═══ BOUTON POSTULER ═══ */}
        <div style={{ marginTop: 24 }}>
          {isOwner ? (
            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', fontWeight: 600 }}>
                C'est votre mission. Les candidatures apparaîtront dans vos messages.
              </p>
            </div>
          ) : alreadyApplied ? (
            <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-border)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--teal-dark)', fontWeight: 800 }}>
                ✅ Vous avez déjà postulé
              </p>
              <Link href="/messages" style={{ fontSize: 13, color: 'var(--teal-dark)', fontWeight: 700, textDecoration: 'underline' }}>
                Voir la conversation →
              </Link>
            </div>
          ) : (
            <button
              onClick={handlePostuler}
              disabled={submitting}
              style={{
                width: '100%', background: 'var(--teal)', color: 'var(--navy)',
                padding: 18, border: 'none', borderRadius: 14,
                fontWeight: 800, fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Envoi...' : !user ? 'Se connecter pour postuler' : 'Postuler à cette mission →'}
            </button>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

function InfoBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ background: 'var(--cream)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {icon} {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{value}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: 24,
  border: '1px solid var(--border)', marginTop: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 14,
};