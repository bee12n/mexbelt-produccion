-- ============================================================
-- Control de Producción Mexbelt — esquema de base de datos
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists procesos (
  id uuid primary key default gen_random_uuid(),
  proceso text not null,
  material text not null,
  producto_nombre text not null,
  ancho_in numeric not null,
  largo_m numeric not null,
  operador text not null,
  estado text not null check (estado in ('corriendo','pausado','finalizado')),
  segmentos jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  finalizado_en timestamptz
);

alter table procesos enable row level security;

-- IMPORTANTE: cambia estos dos correos por los reales de Ale y Ximena
-- ANTES de correr este script (o edítalos después con ALTER POLICY).
-- Deben coincidir exactamente con los correos que les crees en
-- Authentication > Users.

drop policy if exists "operadores insertan procesos" on procesos;
create policy "operadores insertan procesos"
  on procesos for insert
  to anon
  with check (true);

drop policy if exists "operadores ven procesos activos" on procesos;
create policy "operadores ven procesos activos"
  on procesos for select
  to anon
  using (estado <> 'finalizado');

drop policy if exists "operadores actualizan procesos activos" on procesos;
create policy "operadores actualizan procesos activos"
  on procesos for update
  to anon
  using (estado <> 'finalizado')
  with check (true);

drop policy if exists "admins ven todo" on procesos;
create policy "admins ven todo"
  on procesos for select
  to authenticated
  using (auth.jwt() ->> 'email' in ('ale@mexbelt.com', 'ximena@mexbelt.com'));

drop policy if exists "admins actualizan todo" on procesos;
create policy "admins actualizan todo"
  on procesos for update
  to authenticated
  using (auth.jwt() ->> 'email' in ('ale@mexbelt.com', 'ximena@mexbelt.com'))
  with check (true);

drop policy if exists "admins eliminan" on procesos;
create policy "admins eliminan"
  on procesos for delete
  to authenticated
  using (auth.jwt() ->> 'email' in ('ale@mexbelt.com', 'ximena@mexbelt.com'));

-- Habilita Realtime para que la tablet y el panel admin se actualicen
-- solos sin recargar la página.
alter publication supabase_realtime add table procesos;
