create table if not exists public.memories (
  id text primary key,
  event_date date not null,
  date_label text not null,
  short_date text not null,
  title text not null,
  caption text not null default '',
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id text not null references public.memories(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null unique,
  public_url text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_assets (
  asset_key text primary key check (asset_key in ('anniversary-video', 'handwritten-letter')),
  storage_path text not null unique,
  public_url text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  storage_path text not null unique,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.is_pookies_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'pookies_admin', 'false') = 'true';
$$;

revoke all on function public.is_pookies_admin() from public, anon;
grant execute on function public.is_pookies_admin() to authenticated;

alter table public.memories enable row level security;
alter table public.memory_media enable row level security;
alter table public.site_assets enable row level security;
alter table public.playlist_tracks enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.memories, public.memory_media, public.site_assets, public.playlist_tracks to anon, authenticated;
grant insert, update, delete on public.memories, public.memory_media, public.site_assets, public.playlist_tracks to authenticated;

drop policy if exists "Public can read memories" on public.memories;
create policy "Public can read memories" on public.memories for select to anon, authenticated using (true);
drop policy if exists "Admins manage memories" on public.memories;
create policy "Admins manage memories" on public.memories for all to authenticated
  using (public.is_pookies_admin()) with check (public.is_pookies_admin());

drop policy if exists "Public can read memory media" on public.memory_media;
create policy "Public can read memory media" on public.memory_media for select to anon, authenticated using (true);
drop policy if exists "Admins manage memory media" on public.memory_media;
create policy "Admins manage memory media" on public.memory_media for all to authenticated
  using (public.is_pookies_admin()) with check (public.is_pookies_admin());

drop policy if exists "Public can read site assets" on public.site_assets;
create policy "Public can read site assets" on public.site_assets for select to anon, authenticated using (true);
drop policy if exists "Admins manage site assets" on public.site_assets;
create policy "Admins manage site assets" on public.site_assets for all to authenticated
  using (public.is_pookies_admin()) with check (public.is_pookies_admin());

drop policy if exists "Public can read playlist" on public.playlist_tracks;
create policy "Public can read playlist" on public.playlist_tracks for select to anon, authenticated using (true);
drop policy if exists "Admins manage playlist" on public.playlist_tracks;
create policy "Admins manage playlist" on public.playlist_tracks for all to authenticated
  using (public.is_pookies_admin()) with check (public.is_pookies_admin());

insert into public.memories (id, event_date, date_label, short_date, title, caption, sort_order) values
  ('first-vc', '2026-10-14', '14 October', '14 OCT', 'Our first video call', 'The beginning of seeing each other and talking. A little screen, a very big start.', 10),
  ('almost-hour-call', '2026-10-15', '15 October', '15 OCT', 'The almost-one-hour call', 'A call that made time disappear. We had so much to say and somehow it still wasn’t enough.', 20),
  ('first-meet', '2026-10-21', '21 October', '21 OCT', 'The pink helmet & chaat', 'Our first meeting, the iconic pink helmet, and a chaat date I’ll always remember.', 30),
  ('biryani-date', '2026-10-23', '23 October', '23 OCT', 'Biryani date', 'Our biryani chapter, complete with the inside joke that stays ours.', 40),
  ('proposal', '2026-10-27', '27 October', '27 OCT', 'The question in Shillong', 'You were in Shillong. You asked, and I said YES. The day our story became ours.', 50),
  ('sunset-date', '2026-10-27', '27 October', '27 OCT', 'The redo & the sunset', 'A redo date, a sunset, and the lovely feeling that this was only the beginning.', 60),
  ('soft-launch', '2026-10-29', '29 October', '29 OCT', 'A perfectly planned date', 'A cute planned date, and my very first soft launch.', 70),
  ('rapido-premium', '2026-10-31', '31 October', '31 OCT', 'Rapido Premium', 'My personal college-drop and date partner. The sweetest kind of everyday care.', 80),
  ('zilpi-date', '2026-11-01', '1 November', '01 NOV', 'An entire day at Zilpi', 'One whole day together. The kind of day that makes you wish evenings were longer.', 90),
  ('flowers', '2026-11-03', '3 November', '03 NOV', 'Flowers & being fed', 'You fed me with your hands and gifted me flowers. A day full of the little things.', 100),
  ('distance-days', '2026-11-06', '6–17 November', '06–17 NOV', 'Twelve days apart', 'Twelve days of distance and Diwali. Missing you made the hello after feel even sweeter.', 110),
  ('movie-date', '2026-11-18', '18 November', '18 NOV', 'Movie date & our first kiss', 'Back together for a movie date, and our very first kiss.', 120),
  ('game-date', '2026-11-19', '19 November', '19 NOV', 'Game date, another kiss', 'A game date, more laughter, and another kiss to keep close.', 130),
  ('flight-show', '2026-11-22', '22 November', '22 NOV', 'Flight show & workshop', 'A workshop, a flight show, and another day tucked into our story.', 140),
  ('temple-date', '2026-11-24', '24 November', '24 NOV', 'Temple & food date', 'A little peace together, followed by something delicious.', 150),
  ('home-date', '2026-11-25', '25 November', '25 NOV', 'Cooking together at home', 'We cooked, ate together at your home, and spent some private time. A soft, lovely kind of day.', 160)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pookies-media',
  'pookies-media',
  true,
  524288000,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read scrapbook media" on storage.objects;
create policy "Public can read scrapbook media" on storage.objects for select to anon, authenticated
  using (bucket_id = 'pookies-media');
drop policy if exists "Admins upload scrapbook media" on storage.objects;
create policy "Admins upload scrapbook media" on storage.objects for insert to authenticated
  with check (bucket_id = 'pookies-media' and public.is_pookies_admin());
drop policy if exists "Admins update scrapbook media" on storage.objects;
create policy "Admins update scrapbook media" on storage.objects for update to authenticated
  using (bucket_id = 'pookies-media' and public.is_pookies_admin())
  with check (bucket_id = 'pookies-media' and public.is_pookies_admin());
drop policy if exists "Admins delete scrapbook media" on storage.objects;
create policy "Admins delete scrapbook media" on storage.objects for delete to authenticated
  using (bucket_id = 'pookies-media' and public.is_pookies_admin());
