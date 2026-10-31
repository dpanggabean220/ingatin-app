create table public.item (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  judul text not null check (char_length(judul) between 1 and 100),
  template text not null check (template in ('sim','stnk','pajak_kendaraan','kir','paspor','asuransi','custom')),
  jatuh_tempo date,
  siklus_bulan integer check (siklus_bulan is null or siklus_bulan > 0),
  tingkat_pengingat integer[] not null default '{30,7,1,0}',
  catatan text,
  dibuat timestamptz not null default now(),
  diubah timestamptz not null default now()
);

create index item_user_jatuh_tempo_idx on public.item (user_id, jatuh_tempo);

create table public.riwayat_perpanjangan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.item(id) on delete cascade,
  jatuh_tempo_lama date not null,
  jatuh_tempo_baru date not null,
  diperpanjang_pada timestamptz not null default now()
);

create index riwayat_item_idx on public.riwayat_perpanjangan (item_id);

create or replace function public.set_diubah()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diubah = now();
  return new;
end;
$$;

create trigger item_set_diubah
before update on public.item
for each row execute function public.set_diubah();

alter table public.item enable row level security;
alter table public.riwayat_perpanjangan enable row level security;

create policy "item_select_milik_sendiri" on public.item
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "item_insert_milik_sendiri" on public.item
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "item_update_milik_sendiri" on public.item
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "item_delete_milik_sendiri" on public.item
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "riwayat_select_milik_sendiri" on public.riwayat_perpanjangan
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "riwayat_insert_milik_sendiri" on public.riwayat_perpanjangan
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.item i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "riwayat_delete_milik_sendiri" on public.riwayat_perpanjangan
  for delete to authenticated using ((select auth.uid()) = user_id);

