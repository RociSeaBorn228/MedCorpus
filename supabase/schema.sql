-- ============================================================================
--  Медкорпус Конохи — общая база на Supabase
--  Выполните этот скрипт один раз: Supabase Dashboard → SQL Editor → Run.
-- ============================================================================

create table if not exists public.medcorpus_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.medcorpus_state enable row level security;

-- Чтение общего состояния разрешено всем посетителям сайта.
drop policy if exists "medcorpus read" on public.medcorpus_state;
create policy "medcorpus read"
  on public.medcorpus_state
  for select
  using (true);

-- Запись и обновление — через anon-ключ сайта.
drop policy if exists "medcorpus write" on public.medcorpus_state;
create policy "medcorpus write"
  on public.medcorpus_state
  for insert
  with check (true);

drop policy if exists "medcorpus update" on public.medcorpus_state;
create policy "medcorpus update"
  on public.medcorpus_state
  for update
  using (true)
  with check (true);
