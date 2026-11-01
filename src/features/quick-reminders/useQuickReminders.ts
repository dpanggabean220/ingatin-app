import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  bersihkanPengingatLama,
  buatDefaultPengingatKilat,
  hapusPengingatKilat,
  langgananPerubahanKilat,
  type QuickReminder,
  tandaiSelesai,
} from './quickReminders';

/** Hook state untuk daftar Pengingat Kilat. */
export function useQuickReminders() {
  const [reminders, setReminders] = useState<QuickReminder[]>(buatDefaultPengingatKilat);

  const refresh = useCallback(async () => {
    const list = await bersihkanPengingatLama();
    setReminders(list);
  }, []);

  useEffect(() => {
    refresh();
    // Refresh otomatis saat ada aksi dari banner notifikasi (MARK_DONE / SNOOZE_10M)
    const unsubPerubahan = langgananPerubahanKilat(() => {
      refresh();
    });
    // Refresh juga saat aplikasi kembali ke foreground
    const subAppState = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refresh();
      }
    });
    return () => {
      unsubPerubahan();
      subAppState.remove();
    };
  }, [refresh]);

  const selesaikan = useCallback(async (id: string) => {
    // Update optimistis agar terasa instan
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, selesai: true } : r)));
    await tandaiSelesai(id);
  }, []);

  const hapus = useCallback(async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await hapusPengingatKilat(id);
  }, []);

  return { reminders, refresh, selesaikan, hapus };
}
