import { useCallback, useState } from 'react';

import {
  bersihkanPengingatLama,
  hapusPengingatKilat,
  type QuickReminder,
  tandaiSelesai,
} from './quickReminders';

/** Hook state untuk daftar Pengingat Kilat (urut berdasarkan waktu target). */
export function useQuickReminders() {
  const [reminders, setReminders] = useState<QuickReminder[]>([]);

  const refresh = useCallback(async () => {
    const list = await bersihkanPengingatLama();
    list.sort((a, b) => new Date(a.waktu_target).getTime() - new Date(b.waktu_target).getTime());
    setReminders(list);
  }, []);

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
