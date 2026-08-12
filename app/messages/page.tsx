'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'dylan.2005.redon@gmail.com';

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            .select('texte, created_at, type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          return {
            ...conv,
            derniere_message: msg?.[0]
              ? (msg[0].type === 'document' ? '📄 Document' : msg[0].texte)
              : 'Nouvelle conversation',
            derniere_message_date: msg?.[0]?.created_at || conv.created_at,
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
    return (
      <>
        <Header />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => { setActiveConv(null); setMessages([]); loadConversations(); }}
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
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
                Aucun message. Démarrez la conversation !
              </p>
            ) : messages.map(m => {
              const isMine = m.auteur_id === user.id;
              const isDoc = m.type === 'document';
              let docName = 'Document';
              if (isDoc) { try { docName = JSON.parse(m.texte)?.name || 'Document'; } catch { /* ignore */ } }
              return (
                <div key={m.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    <div
                      onClick={isDoc ? () => ouvrirDocument(m.texte) : undefined}
                      style={{
                        background: isMine ? 'var(--teal)' : 'white',
                        color: isMine ? 'var(--navy)' : 'var(--text-dark)',
                        padding: '10px 14px', borderRadius: 16,
                        border: isMine ? 'none' : '1px solid var(--border)',
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
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              );
            })}
          </div>

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
        </main>
        <Footer />
      </>
    );
  }

  // ═══════════ VUE LISTE DES CONVERSATIONS ═══════════
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

        {conversations.length === 0 ? (
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
            {conversations.map((conv, i) => {
              const other = getOther(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    background: 'transparent', border: 'none',
                    borderBottom: i === conversations.length - 1 ? 'none' : '1px solid var(--border)',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                    {other?.avatar_lettre || (other?.nom || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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