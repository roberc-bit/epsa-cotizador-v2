-- ============================================================
-- EPSA Cotizador V2 — Schema Supabase
-- Correr en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Habilitar extensión UUID
create extension if not exists "pgcrypto";

-- ── EMPRESA ──────────────────────────────────────────────────
create table empresa (
  id          integer primary key default 1 check (id = 1),  -- solo 1 fila
  nombre      text not null default 'Escandinavia del Plata S.A.',
  validez     text not null default 'Julio 2025',
  tipo_cambio numeric(12,2) not null default 1150,
  email       text,
  telefono    text,
  pie_cotizacion text default 'Precios en USD FOB. No incluye flete, seguro ni derechos de importación.',
  updated_at  timestamptz default now()
);
insert into empresa (id) values (1) on conflict do nothing;

-- ── FAMILIAS (categorías) ─────────────────────────────────────
create table familias (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nombre      text not null,
  orden       integer default 0,
  imagen_url  text,
  activo      boolean default true
);

insert into familias (slug, nombre, orden) values
  ('camiones-articulados', 'Camiones Articulados', 1),
  ('excavadoras',          'Excavadoras',          2),
  ('cargadoras',           'Cargadoras',           3),
  ('mini-excavadoras',     'Mini Excavadoras',     4),
  ('compactacion',         'Compactación',         5);

-- ── MODELOS ──────────────────────────────────────────────────
create table modelos (
  id           uuid primary key default gen_random_uuid(),
  familia_id   uuid references familias(id) on delete cascade,
  codigo       text unique not null,
  nombre       text not null,
  descripcion  text,
  precio_fob   numeric(12,2),
  precio_lista numeric(12,2) not null,
  factor       numeric(8,6) generated always as (
    case when precio_fob > 0 then precio_lista / precio_fob else null end
  ) stored,
  imagen_url   text,
  activo       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── ITEMS DEL MODELO ─────────────────────────────────────────
create table items (
  id              uuid primary key default gen_random_uuid(),
  modelo_id       uuid references modelos(id) on delete cascade,
  tipo            text not null check (tipo in ('fijo','configurable','dropdown','opcional')),
  grupo_dropdown  text,           -- nombre del grupo (ej: "Neumáticos")
  es_default      boolean default false,
  seccion         text,           -- para opcionales (ej: "CARROCERÍA")
  codigo          text not null,
  descripcion     text not null,
  precio_fob      numeric(12,2) default 0,
  precio_lista    numeric(12,2) default 0,
  orden           integer default 0,
  activo          boolean default true
);
create index on items(modelo_id);
create index on items(tipo);

-- ── USUARIOS (perfil, la auth la maneja Supabase Auth) ───────
create table perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  rol         text not null default 'vendedor' check (rol in ('admin','vendedor')),
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- Trigger para crear perfil al registrar usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'vendedor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── COTIZACIONES ─────────────────────────────────────────────
create table cotizaciones (
  id              uuid primary key default gen_random_uuid(),
  numero          serial unique,
  usuario_id      uuid references perfiles(id),
  modelo_id       uuid references modelos(id),
  cliente_nombre  text,
  cliente_email   text,
  items_json      jsonb not null default '[]',  -- snapshot de la config
  precio_base     numeric(12,2) not null,
  precio_total    numeric(12,2) not null,
  descuento_pct   numeric(5,2) default 0,
  precio_final    numeric(12,2) not null,
  email_enviado   boolean default false,
  created_at      timestamptz default now()
);
create index on cotizaciones(usuario_id);
create index on cotizaciones(created_at desc);

-- ── ACTIVIDAD ────────────────────────────────────────────────
create table actividad (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid references perfiles(id),
  tipo        text not null check (tipo in ('login','logout','modelo_visto','cotizacion','lista_precios')),
  detalle     text,
  metadata    jsonb,
  created_at  timestamptz default now()
);
create index on actividad(created_at desc);
create index on actividad(usuario_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table empresa         enable row level security;
alter table familias        enable row level security;
alter table modelos         enable row level security;
alter table items           enable row level security;
alter table perfiles        enable row level security;
alter table cotizaciones    enable row level security;
alter table actividad       enable row level security;

-- Políticas: usuarios autenticados pueden leer todo
create policy "auth_read_empresa"      on empresa         for select to authenticated using (true);
create policy "auth_read_familias"     on familias        for select to authenticated using (true);
create policy "auth_read_modelos"      on modelos         for select to authenticated using (true);
create policy "auth_read_items"        on items           for select to authenticated using (true);
create policy "auth_read_perfiles"     on perfiles        for select to authenticated using (true);
create policy "auth_read_cotizaciones" on cotizaciones    for select to authenticated using (true);
create policy "auth_read_actividad"    on actividad       for select to authenticated using (true);

-- Solo admins pueden escribir en tablas de configuración
create policy "admin_write_empresa"  on empresa  for all to authenticated
  using ((select rol from perfiles where id = auth.uid()) = 'admin');
create policy "admin_write_familias" on familias for all to authenticated
  using ((select rol from perfiles where id = auth.uid()) = 'admin');
create policy "admin_write_modelos"  on modelos  for all to authenticated
  using ((select rol from perfiles where id = auth.uid()) = 'admin');
create policy "admin_write_items"    on items    for all to authenticated
  using ((select rol from perfiles where id = auth.uid()) = 'admin');
create policy "admin_write_perfiles" on perfiles for all to authenticated
  using ((select rol from perfiles where id = auth.uid()) = 'admin');

-- Cualquier usuario autenticado puede insertar sus propias cotizaciones y actividad
create policy "user_insert_cotizaciones" on cotizaciones for insert to authenticated
  with check (usuario_id = auth.uid());
create policy "user_insert_actividad"    on actividad    for insert to authenticated
  with check (usuario_id = auth.uid());
