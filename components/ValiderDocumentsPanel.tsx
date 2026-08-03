'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'Document';

const LABELS: Record<string, string> = {
  ci_recto: "Carte d'identité — Recto",
  ci_verso: "Carte d'identité — Verso",
  carte_vit: 'Carte vitale',
  auto_par: 'Autorisation parentale signée',
  ci_par_recto: "Carte d'identité du parent — Recto",
  ci_par_verso: "Carte d'identité du parent — Verso",
  cni: "Carte d'identité recto-verso",
  vitale: 'Carte vitale',
  kbis: 'Extrait Kbis',
  autorisation: 'Autorisation parentale',
  cni_responsable: "Carte d'identité du responsable légal",
};

type DocRow = {
  id: string;
  user_id: string;
  type: string;
  storage_path: string;
  created_at: string;
  profiles: { nom: string; statut: string } | null;
};

export default function ValiderDocumentsPanel({
  onResult,
}: {
  onResult: (type: 'success' | 'error', msg: string) => void;
}) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [traitId, setTraitId] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents_identite')
      .select('id, user_id, type, storage_path, created_at, profiles(nom, statut)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: true });
    if (error) onResult('error', 'Impossible de charger les documents : ' + error.message);
    setDocs((data as unknown as DocRow[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function voirDocument(path: string) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) { onResult('error', "Impossible d'ouvrir le document."); return; }
    window.open(data.signedUrl, '_blank');
  }

  async function traiter(documentId: string, decision: 'valide' | 'refuse') {
    setTraitId(documentId);
    const { data, error } = await supabase.functions.invoke('admin-valider-document', {
      body: { documentId, decision },
    });
    setTraitId(null);

    let errMsg = (data as { error?: string } | null)?.error;
    if (!errMsg && error) {
      errMsg = error.message;
      const ctx = (error as unknown as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
      if (ctx?.json) {
        try { errMsg = (await ctx.json())?.error ?? errMsg; } catch { /* garde le message générique */ }
      }
    }
    if (errMsg) { onResult('error', errMsg); return; }

    setDocs(prev => prev.filter(d => d.id !== documentId));
    onResult('success', decision === 'valide' ? '✅ Document validé, le compte est maintenant vérifié.' : '❌ Document refusé.');
  }

  if (loading) return <div className="empty-state"><span className="big-emoji">⏳</span><h3>Chargement…</h3></div>;
  if (docs.length === 0) return <div className="empty-state"><span className="big-emoji">✅</span><h3>Aucun document en attente</h3></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {docs.map(d => (
        <div key={d.id} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>
            {d.profiles?.nom || 'Utilisateur'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 2 }}>{LABELS[d.type] || d.type}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Envoyé le {new Date(d.created_at).toLocaleDateString('fr-FR')}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => voirDocument(d.storage_path)} style={{ ...btnStyle, background: 'var(--cream)', color: 'var(--navy)', border: '1px solid var(--border)' }}>
              📄 Voir le document
            </button>
            <button
              onClick={() => traiter(d.id, 'refuse')}
              disabled={traitId === d.id}
              style={{ ...btnStyle, background: '#EF4444', color: 'white', opacity: traitId === d.id ? 0.5 : 1 }}
            >
              ❌ Refuser
            </button>
            <button
              onClick={() => traiter(d.id, 'valide')}
              disabled={traitId === d.id}
              style={{ ...btnStyle, background: '#10B981', color: 'white', opacity: traitId === d.id ? 0.5 : 1 }}
            >
              {traitId === d.id ? '⏳' : '✅ Valider'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8, border: 'none',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};
