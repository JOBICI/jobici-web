'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { signalerUtilisateur, bloquerUtilisateur, debloquerUtilisateur, getRelationsBlocage, MOTIFS_SIGNALEMENT } from '@/lib/moderation';

const ADMIN_EMAIL = 'contact@job-ici.com';

type Conversation = {
  id: string;
  mission_id: string;
  travailleur_id: string;
  employeur_id: string;
  statut: string;
  created_at: string;
  missions?: { titre: string; tarif: number; emoji: string; type: string };
  travailleur?: { nom: string; avatar_lettre: string };
  employeur?: { nom: string; avatar_lettre: string };
  derniere_message?: string;
  derniere_message_date?: string;
  non_lu?: boolean;
  lu_employeur_at?: string | null;
  lu_travailleur_at?: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  auteur_id: string;
  texte: string;
  type: string;
  offre_prix: number | null;
  offre_statut: string | null;
  created_at: string;
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 48) return 'Hier';
  if (diffH < 168) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convParam = searchParams.get('conv');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [blocages, setBlocages] = useState<{ bloquesParMoi: string[]; mOntBloque: string[] }>({ bloquesParMoi: [], mOntBloque: [] });
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [motifChoisi, setMotifChoisi] = useState<string | null>(null);
  const [detailReport, setDetailReport] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [blocageEnCours, setBlocageEnCours] = useState(false);
  const [candId, setCandId] = useState<string | null>(null);
  const [candStatut, setCandStatut] = useState<string | null>(null);
  const [dejaNote, setDejaNote] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingNote, setRatingNote] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [finishing, setFinishing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBlocages = useCallback(async () => {
    if (!user) { setBlocages({ bloquesParMoi: [], mOntBloque: [] }); return; }
    const rel = await getRelationsBlocage(user.id);
    setBlocages(rel);
  }, [user]);

  useEffect(() => { loadBlocages(); }, [loadBlocages]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/connexion');
  }, [user, authLoading, router]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConv(true);

    let query = supabase
      .from('conversations')
      .select(`
        *,
        missions(titre, tarif, emoji, type),
        travailleur:profiles!travailleur_id(nom, avatar_lettre),
        employeur:profiles!employeur_id(nom, avatar_lettre)
      `)
      .order('created_at', { ascending: false });
    // L'admin voit toutes les conversations (support, suivi des mises en relation)
    if (!isAdmin) query = query.or(`travailleur_id.eq.${user.id},employeur_id.eq.${user.id}`);
    const { data, error } = await query;

    if (!error && data) {
      const enriched = await Promise.all(
        data.map(async (conv: any) => {
          const { data: msg } = await supabase
            .from('messages')
            .select('texte, created_at, type, auteur_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          const dernierMsg = msg?.[0];
          const monLuAt = user.id === conv.employeur_id ? conv.lu_employeur_at : conv.lu_travailleur_at;
          const nonLu = !isAdmin && !!dernierMsg && dernierMsg.auteur_id !== user.id
            && (!monLuAt || new Date(dernierMsg.created_at) > new Date(monLuAt));
          return {
            ...conv,
            derniere_message: dernierMsg
              ? (dernierMsg.type === 'document' ? '📄 Document' : dernierMsg.texte)
              : 'Nouvelle conversation',
            derniere_message_date: dernierMsg?.created_at || conv.created_at,
            non_lu: nonLu,
          };
        })
      );
      setConversations(enriched as Conversation[]);
    }
    setLoadingConv(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // Ouvre directement la conversation ciblée par ?conv=<id> (lien depuis l'admin)
  useEffect(() => {
    if (!convParam || conversations.length === 0) return;
    const match = conversations.find(c => c.id === convParam);
    if (match) setActiveConv(match);
  }, [convParam, conversations]);

  useEffect(() => {
    if (!activeConv || !user) { setCandId(null); setCandStatut(null); setDejaNote(false); return; }

    async function loadCandidature() {
      const { data } = await supabase
        .from('candidatures')
        .select('id, statut')
        .eq('mission_id', activeConv!.mission_id)
        .eq('travailleur_id', activeConv!.travailleur_id)
        .eq('employeur_id', activeConv!.employeur_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) { setCandId(null); setCandStatut(null); setDejaNote(false); return; }
      setCandId(data.id);
      setCandStatut(data.statut);
      const { data: avisExistant } = await supabase
        .from('avis')
        .select('id')
        .eq('mission_id', activeConv!.mission_id)
        .eq('auteur_id', user!.id)
        .maybeSingle();
      setDejaNote(!!avisExistant);
    }
    loadCandidature();
  }, [activeConv, user]);

  async function submitRating() {
    if (!candId) return;
    if (ratingNote < 1) { alert('Choisissez une note de 1 à 5 étoiles.'); return; }
    setFinishing(true);
    const { data, error } = await supabase.functions.invoke('swift-endpoint', {
      body: { candidature_id: candId, event: 'mission_terminee', note: ratingNote, commentaire: ratingComment.trim() },
    });
    setFinishing(false);
    if (error || (data as { error?: string })?.error) {
      alert("La mission n'a pas pu être finalisée. Réessayez.");
      return;
    }
    setCandStatut('terminee');
    setDejaNote(true);
    setShowRating(false);
    setRatingNote(0);
    setRatingComment('');
    alert(`🏁 Note de ${ratingNote}/5 enregistrée. Merci !`);
  }

  useEffect(() => {
    if (!activeConv) return;

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConv!.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100);
    }
    loadMessages();

    // Marque la conversation comme lue (seulement pour un vrai participant, pas l'admin).
    if (user?.id === activeConv.employeur_id || user?.id === activeConv.travailleur_id) {
      const col = user.id === activeConv.employeur_id ? 'lu_employeur_at' : 'lu_travailleur_at';
      supabase.from('conversations').update({ [col]: new Date().toISOString() }).eq('id', activeConv.id).then(() => {});
    }

    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [activeConv]);

  async function deleteMessage(msgId: string) {
    if (!confirm('Supprimer ce message ?')) return;
    setDeletingMsgId(msgId);
    await supabase.from('messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setDeletingMsgId(null);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user || sending || !activeConv) return;
    setSending(true);
    const texte = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      auteur_id: user.id,
      texte,
      type: 'normal',
    });

    setSending(false);
    if (error) {
      alert("Impossible d'envoyer le message.");
      setNewMessage(texte);
    }
  }

  async function ouvrirDocument(texte: string) {
    let path = '';
    try { path = JSON.parse(texte)?.path ?? ''; } catch { /* ignore */ }
    if (!path) return;
    const { data, error } = await supabase.storage.from('Document').createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) { alert("Impossible d'ouvrir le document."); return; }
    window.open(data.signedUrl, '_blank');
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !activeConv) return;
    setUploadingDoc(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `messages/${activeConv.id}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('Document').upload(path, file, {
      contentType: file.type || 'application/octet-stream', upsert: true,
    });
    if (upErr) { setUploadingDoc(false); alert('Envoi du document impossible : ' + upErr.message); return; }
    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      auteur_id: user.id,
      texte: JSON.stringify({ path, name: file.name }),
      type: 'document',
    });
    setUploadingDoc(false);
  }

  function getOther(conv: Conversation) {
    const isEmployeur = conv.employeur_id === user?.id;
    return isEmployeur ? conv.travailleur : conv.employeur;
  }

  function getOtherId(conv: Conversation) {
    return conv.employeur_id === user?.id ? conv.travailleur_id : conv.employeur_id;
  }

  async function envoyerSignalement() {
    if (!activeConv || !motifChoisi) { alert('Choisissez un motif.'); return; }
    setReportSending(true);
    const motifFinal = detailReport.trim() ? `${motifChoisi} — ${detailReport.trim()}` : motifChoisi;
    const { error } = await signalerUtilisateur(getOtherId(activeConv), motifFinal, { conversationId: activeConv.id });
    setReportSending(false);
    if (error) { alert('Erreur : ' + error); return; }
    setShowReport(false);
    setMotifChoisi(null);
    setDetailReport('');
    alert('✅ Signalement envoyé. Notre équipe modération va examiner ce signalement sous 24h.');
  }

  async function handleBloquer() {
    if (!activeConv) return;
    const other = getOther(activeConv);
    if (!confirm(`Bloquer ${other?.nom || 'cette personne'} ? Elle ne pourra plus vous envoyer de messages.`)) return;
    setBlocageEnCours(true);
    const { error } = await bloquerUtilisateur(getOtherId(activeConv));
    setBlocageEnCours(false);
    setShowMenu(false);
    if (error) { alert('Erreur : ' + error); return; }
    await loadBlocages();
    alert('🚫 Utilisateur bloqué.');
  }

  async function handleDebloquer() {
    if (!activeConv) return;
    setBlocageEnCours(true);
    const { error } = await debloquerUtilisateur(getOtherId(activeConv));
    setBlocageEnCours(false);
    setShowMenu(false);
    if (error) { alert('Erreur : ' + error); return; }
    await loadBlocages();
    alert('✅ Utilisateur débloqué.');
  }

  async function repondreOffre(messageId: string, accepte: boolean) {
    const { error } = await supabase
      .from('messages')
      .update({ offre_statut: accepte ? 'acceptee' : 'refusee' })
      .eq('id', messageId);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offre_statut: accepte ? 'acceptee' : 'refusee' } : m));
    }
  }

  if (authLoading || loadingConv) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chargement des messages...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;
  // ═══════════ VUE CONVERSATION OUVERTE ═══════════
  if (activeConv) {
    const other = getOther(activeConv);
    const otherId = getOtherId(activeConv);
    const isEmployeur = activeConv.employeur_id === user.id;
    const blockedByMe = blocages.bloquesParMoi.includes(otherId);
    const blockedMe = blocages.mOntBloque.includes(otherId);
    const conversationBloquee = blockedByMe || blockedMe;
    return (
      <>
        <Header />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => { setActiveConv(null); setMessages([]); setShowMenu(false); loadConversations(); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--navy)' }}>
              ←
            </button>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
              {other?.avatar_lettre || (other?.nom || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>
                {isAdmin
                  ? `${activeConv.travailleur?.nom || '?'} ↔ ${activeConv.employeur?.nom || '?'}`
                  : (other?.nom || 'Utilisateur')}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeConv.missions?.emoji} {activeConv.missions?.titre} · {activeConv.missions?.tarif}€
              </p>
            </div>
            {!isAdmin && (candStatut === 'acceptee' || candStatut === 'terminee') && !dejaNote ? (
              <button onClick={() => setShowRating(true)} disabled={finishing}
                style={{ background: 'transparent', border: 'none', cursor: finishing ? 'not-allowed' : 'pointer', color: 'var(--teal-dark, #088B78)', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', flexShrink: 0 }}>
                {finishing ? '…' : '🏁 Terminée'}
              </button>
            ) : candStatut === 'terminee' ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✅ Réalisée</span>
            ) : null}
            {!isAdmin && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(v => !v)} title="Options"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', fontWeight: 800, padding: '4px 8px' }}>
                  ⋯
                </button>
                {showMenu && (
                  <div style={{
                    position: 'absolute', top: '120%', right: 0, background: 'white',
                    border: '1px solid var(--border)', borderRadius: 12, padding: 8, minWidth: 190,
                    boxShadow: '0 8px 24px rgba(13,31,45,0.12)', zIndex: 200,
                  }}>
                    <button
                      onClick={() => { setShowMenu(false); setShowReport(true); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      🚩 Signaler
                    </button>
                    <button
                      onClick={blockedByMe ? handleDebloquer : handleBloquer}
                      disabled={blocageEnCours}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: blockedByMe ? 'var(--teal-dark, #0d7)' : 'var(--urgent)', background: 'transparent', border: 'none', borderRadius: 8, cursor: blocageEnCours ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: blocageEnCours ? 0.5 : 1 }}
                    >
                      {blockedByMe ? '✅ Débloquer' : '🚫 Bloquer'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {conversationBloquee && (
            <div style={{ background: '#fdecea', border: '1px solid #f5b5ae', borderRadius: 10, padding: '10px 14px', margin: '10px 0' }}>
              <p style={{ fontSize: 13, color: '#b3261e', fontWeight: 600 }}>
                {blockedByMe
                  ? '🚫 Vous avez bloqué cet utilisateur. Vous ne pouvez plus échanger de messages.'
                  : '🚫 Vous ne pouvez plus échanger de messages avec cette personne.'}
              </p>
            </div>
          )}

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
                Aucun message. Démarrez la conversation !
              </p>
            ) : messages.map(m => {
              const isMine = m.auteur_id === user.id;
              const isDoc = m.type === 'document';
              // Couleur par rôle réel (employeur/travailleur), visible de tous — pas
              // seulement de l'admin — pour repérer qui a envoyé quoi d'un coup d'œil.
              // L'alignement reste basé sur "mien/autre" pour les participants ; pour
              // l'admin (qui n'est ni l'un ni l'autre), il suit le rôle.
              const estMsgEmployeur = m.auteur_id === activeConv.employeur_id;
              const rightAlign = isAdmin ? estMsgEmployeur : isMine;
              const roleColor = estMsgEmployeur ? 'var(--gold)' : 'var(--blue)';
              const roleBg = estMsgEmployeur ? 'rgba(201,168,76,0.14)' : 'rgba(59,130,246,0.10)';
              const senderLabel = isAdmin && (
                <p style={{ fontSize: 10, fontWeight: 800, color: roleColor, margin: '0 2px 3px', textAlign: rightAlign ? 'right' : 'left' }}>
                  {estMsgEmployeur ? `💼 ${activeConv.employeur?.nom || 'Employeur'}` : `👷 ${activeConv.travailleur?.nom || 'Travailleur'}`}
                </p>
              );

              if (m.type === 'offre') {
                return (
                  <div key={m.id} style={{ alignSelf: rightAlign ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    {senderLabel}
                    <div style={{ background: roleBg, border: `1.5px solid ${roleColor}`, borderRadius: 16, padding: '12px 16px' }}>
                      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--teal-dark, #0a8a7a)' }}>
                        💰 OFFRE DE NÉGOCIATION
                      </p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: '6px 0' }}>
                        {m.offre_prix} €
                      </p>
                      {m.offre_statut === 'en_attente' && !isMine && !isAdmin && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button onClick={() => repondreOffre(m.id, true)}
                            style={{ background: 'var(--teal)', color: 'var(--navy)', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Accepter
                          </button>
                          <button onClick={() => repondreOffre(m.id, false)}
                            style={{ background: 'transparent', color: 'var(--urgent)', border: '1px solid var(--urgent)', borderRadius: 8, padding: '7px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Refuser
                          </button>
                        </div>
                      )}
                      {m.offre_statut === 'acceptee' && (
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-dark, #0a8a7a)', marginTop: 6 }}>✅ Offre acceptée</p>
                      )}
                      {m.offre_statut === 'refusee' && (
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--urgent)', marginTop: 6 }}>❌ Offre refusée</p>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              }

              let docName = 'Document';
              if (isDoc) { try { docName = JSON.parse(m.texte)?.name || 'Document'; } catch { /* ignore */ } }
              return (
                <div key={m.id} style={{ alignSelf: rightAlign ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  {senderLabel}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexDirection: rightAlign ? 'row-reverse' : 'row' }}>
                    <div
                      onClick={isDoc ? () => ouvrirDocument(m.texte) : undefined}
                      style={{
                        background: roleBg,
                        color: 'var(--text-dark)',
                        padding: '10px 14px', borderRadius: 16,
                        border: `1.5px solid ${roleColor}`,
                        fontSize: 14, lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        cursor: isDoc ? 'pointer' : 'default',
                        fontWeight: isDoc ? 700 : 400,
                      }}>
                      {isDoc ? `📄 ${docName} · Télécharger` : m.texte}
                    </div>
                    {isMine && (
                      <button
                        onClick={() => deleteMessage(m.id)}
                        disabled={deletingMsgId === m.id}
                        title="Supprimer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: 2, opacity: deletingMsgId === m.id ? 0.3 : 0.6, flexShrink: 0 }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: rightAlign ? 'right' : 'left' }}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              );
            })}
          </div>

          {!conversationBloquee && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={onPickFile} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc} title="Joindre un document (PDF)"
                style={{ background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 999, padding: '0 14px', fontSize: 18, cursor: uploadingDoc ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {uploadingDoc ? '⏳' : '📎'}
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Écrivez votre message..."
                style={{ flex: 1, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 999, fontSize: 14, outline: 'none', background: 'var(--cream)', fontFamily: 'inherit' }}
              />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                style={{ background: 'var(--teal)', color: 'var(--navy)', border: 'none', borderRadius: 999, padding: '0 20px', fontWeight: 800, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', opacity: (sending || !newMessage.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}>
                Envoyer
              </button>
            </div>
          )}
        </main>
        <Footer />

        {showReport && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                Signaler {other?.nom || 'cet utilisateur'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                Choisissez le motif qui correspond le mieux.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {MOTIFS_SIGNALEMENT.map(mo => (
                  <button
                    key={mo}
                    onClick={() => setMotifChoisi(mo)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontFamily: 'inherit',
                      border: motifChoisi === mo ? '1.5px solid var(--teal)' : '1.5px solid var(--border)',
                      background: motifChoisi === mo ? 'rgba(20,184,166,0.08)' : 'transparent',
                      color: motifChoisi === mo ? 'var(--navy)' : 'var(--text-mid)',
                      fontWeight: motifChoisi === mo ? 700 : 500, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    {mo}
                  </button>
                ))}
              </div>
              <textarea
                value={detailReport}
                onChange={e => setDetailReport(e.target.value)}
                placeholder="Détails supplémentaires (optionnel)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowReport(false); setMotifChoisi(null); setDetailReport(''); }}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-dark)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Annuler
                </button>
                <button
                  onClick={envoyerSignalement}
                  disabled={reportSending}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: 'none', background: 'var(--urgent)', color: 'white', fontWeight: 800, fontSize: 14, cursor: reportSending ? 'not-allowed' : 'pointer', opacity: reportSending ? 0.6 : 1, fontFamily: 'inherit' }}
                >
                  {reportSending ? '…' : 'Signaler'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRating && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,31,45,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                Noter {other?.nom || 'cette personne'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {isEmployeur ? 'Votre note influe sur ses points au classement.' : "Comment s'est passée la mission avec ce professionnel/particulier ?"}
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRatingNote(n)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0, lineHeight: 1, color: n <= ratingNote ? '#F59E0B' : 'var(--border)' }}>
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Un commentaire (optionnel)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowRating(false); setRatingNote(0); setRatingComment(''); }}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-dark)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Annuler
                </button>
                <button
                  onClick={submitRating}
                  disabled={finishing}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: 'none', background: 'var(--teal)', color: 'var(--navy)', fontWeight: 800, fontSize: 14, cursor: finishing ? 'not-allowed' : 'pointer', opacity: finishing ? 0.6 : 1, fontFamily: 'inherit' }}
                >
                  {finishing ? '…' : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ═══════════ VUE LISTE DES CONVERSATIONS ═══════════
  // On masque de la liste les conversations avec quelqu'un que j'ai bloqué.
  const conversationsVisibles = conversations.filter(conv => !blocages.bloquesParMoi.includes(getOtherId(conv)));

  return (
    <>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--navy)', marginBottom: 8, letterSpacing: -0.5 }}>
          💬 Messages
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 24 }}>
          Vos conversations avec les employeurs et travailleurs.
        </p>

        {conversationsVisibles.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 50, textAlign: 'center' }}>
            <span style={{ fontSize: 50, display: 'block', marginBottom: 16 }}>💬</span>
            <h3 style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Aucune conversation
            </h3>
            <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 20 }}>
              Postulez à une mission pour démarrer une conversation, ou attendez qu'un travailleur réponde à vos annonces.
            </p>
            <Link href="/missions" style={{ color: 'var(--teal)', fontWeight: 700 }}>
              Voir les missions →
            </Link>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {conversationsVisibles.map((conv, i) => {
              const other = getOther(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    borderBottom: i === conversationsVisibles.length - 1 ? 'none' : '1px solid var(--border)',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                      {other?.avatar_lettre || (other?.nom || '?').charAt(0).toUpperCase()}
                    </div>
                    {conv.non_lu && (
                      <span style={{ position: 'absolute', top: -2, right: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--urgent)', border: '2px solid white' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: conv.non_lu ? 900 : 800, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isAdmin ? `${conv.travailleur?.nom || '?'} ↔ ${conv.employeur?.nom || '?'}` : (other?.nom || 'Utilisateur')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {conv.derniere_message_date ? formatTime(conv.derniere_message_date) : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                      {conv.missions?.emoji} {conv.missions?.titre}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.derniere_message}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}