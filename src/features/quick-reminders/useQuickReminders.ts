import { useCallback, useEffect, useState } from 'react';

import {
  bersihkanPengingatLama,
  buatDefaultPengingatKilat,
  hapusPengingatKilat,
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
