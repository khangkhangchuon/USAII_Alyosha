-- Alyosha — initial schema. Paste into Supabase SQL Editor.
-- Build plan §4. jsonb is used for type-specific fields to keep resource types flexible.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- --- Reference / org-side tables ---

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('nonprofit','government','community','faith_based','employer')),
  location text,
  partnered boolean not null default false,
  contact jsonb default '{}'::jsonb,
  services_summary text,
  created_at timestamptz not null default now()
);

create table if not exists caseworkers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_id uuid references organizations(id) on delete set null,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  type text not null check (type in ('employment','housing','legal','financial','education','healthcare','id_benefits')),
  title text not null,
  description text,
  location text,
  eligibility text,
  details jsonb default '{}'::jsonb,
  date_listed timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','needs_review','paused','removed'))
);

-- --- Client-side tables ---

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  released_on date,
  incarceration_years int,
  documents jsonb default '{}'::jsonb,
  skills jsonb default '[]'::jsonb,
  needs jsonb default '[]'::jsonb,
  goals text,
  assigned_caseworker_id uuid references caseworkers(id) on delete set null,
  profile_summary text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists plan_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  "order" int not null,
  category text not null check (category in ('id','benefits','housing','employment','education','legal','healthcare','financial','other')),
  title text not null,
  instructions text,
  where_to_go text,
  what_to_bring text,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  depends_on uuid references plan_steps(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists plan_steps_client_idx on plan_steps(client_id, "order");

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  sender text not null check (sender in ('client','org')),
  body text not null,
  created_at timestamptz not null default now()
);

-- --- RAG corpus ---

create table if not exists corpus_chunks (
  id uuid primary key default gen_random_uuid(),
  source_title text not null,
  source_url text not null,
  source_date date,
  chunk_text text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- HNSW index for fast similarity search over 1536-dim embeddings.
create index if not exists corpus_chunks_embedding_idx
  on corpus_chunks
  using hnsw (embedding vector_cosine_ops);

-- Cosine similarity helper used by /lib/rag/retrieve.ts.
create or replace function match_corpus_chunks(
  query_embedding vector(1536),
  match_count int default 6
)
returns table (
  id uuid,
  source_title text,
  source_url text,
  source_date date,
  chunk_text text,
  similarity float
)
language sql stable as $$
  select
    c.id,
    c.source_title,
    c.source_url,
    c.source_date,
    c.chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity
  from corpus_chunks c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
