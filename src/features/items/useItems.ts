import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Item } from '@/types/database';
import { sinkronkanDataWidget } from '@/utils/widgetSync';

interface UseItemsResult {
  items: Item[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Ambil semua item milik pengguna, urut jatuh tempo (tanggal kosong di akhir). */
export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('item')
      .select('*')
      .order('jatuh_tempo', { ascending: true, nullsFirst: false });

    if (fetchError) {
      setError('Gagal memuat dokumen. Periksa koneksi internetmu lalu coba lagi.');
    } else {
      const itemsList = (data ?? []) as Item[];
      setItems(itemsList);
      sinkronkanDataWidget(itemsList).catch((err) =>
        console.debug('[useItems] Gagal sinkronkan widget:', err)
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

