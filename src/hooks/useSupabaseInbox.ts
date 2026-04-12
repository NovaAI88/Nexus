import { useState, useEffect, useCallback } from 'react';
import { supabase, DbInboxItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type InboxItem = {
  id: string;
  title: string;
  archived: boolean;
  createdAt: string;
};

function fromDb(row: DbInboxItem): InboxItem {
  return {
    id:        row.id,
    title:     row.title,
    archived:  row.archived,
    createdAt: row.created_at,
  };
}

export function useSupabaseInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (!error && data) setItems((data as DbInboxItem[]).map(fromDb));
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inbox_items',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [fromDb(payload.new as DbInboxItem), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = fromDb(payload.new as DbInboxItem);
          if (updated.archived) {
            setItems((prev) => prev.filter((i) => i.id !== updated.id));
          } else {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
          }
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addItem = useCallback(async (title: string) => {
    if (!user) return;
    const id = `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await supabase.from('inbox_items').insert({
      id,
      user_id: user.id,
      title,
      archived: false,
    });
  }, [user]);

  const archiveItem = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('inbox_items').update({ archived: true }).eq('id', id);
  }, [user]);

  const removeItem = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('inbox_items').delete().eq('id', id);
  }, [user]);

  return { items, loading, addItem, archiveItem, removeItem };
}
