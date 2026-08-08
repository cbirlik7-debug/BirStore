import { useEffect, useRef } from 'react';
import { supabase } from '../supabase/client';

/**
 * Verilen tablolarda değişiklik olduğunda `onChange`'i debounce'lu tetikler.
 * Art arda gelen değişiklikler (birden fazla satır/tablo) tek çağrıda toplanır.
 */
export function useRealtimeRefresh(tables: string[], onChange: () => void, debounceMs = 1000): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const tablesKey = tables.join(',');

  useEffect(() => {
    const channel = supabase.channel(`realtime:${tablesKey}`);
    for (const table of tablesKey.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChangeRef.current(), debounceMs);
      });
    }
    channel.subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tablesKey, debounceMs]);
}
