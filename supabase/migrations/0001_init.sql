-- Runova Auto — complete initial schema, RLS and realtime.
-- Auth model: dealers.id === Supabase auth user id (FK to auth.users).
-- All RLS uses auth.uid() = dealer_id directly (no join table).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.dealers (
  id uuid primary key references auth.users(id) on delete cascade,
  dealer_name text,
  whatsapp_number text,
  booking_link text,
  ai_instructions text,
  whatsapp_token text,        -- secret: only read server-side, never sent to the browser
  opening_hours text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  make text,
  model text,
  year int,
  mileage int,
  price int,
  colour text,
  fuel_type text,
  transmission text,
  description text,
  available boolean not null default true,
  archived_at timestamptz,    -- null = active/available; timestamp = archived or sold
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  contact text,
  channel text,               -- whatsapp / web / email
  budget text,
  part_ex boolean,
  timeline text,
  lead_stage text default 'new',          -- new / contacted / viewing_booked / deal_closed
  lead_temperature text,                  -- hot / warm / cold
  last_message text,
  ai_active boolean not null default true,
  interested_stock_id uuid references public.stock(id) on delete set null,
  created_at timestamptz not null default now(),
  last_contact timestamptz default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  contact text,
  sender_type text not null check (sender_type in ('user', 'ai', 'staff')),
  message_text text,
  timestamp timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_stock_dealer_id on public.stock(dealer_id);
create index if not exists idx_leads_dealer_id on public.leads(dealer_id);
create index if not exists idx_leads_stage on public.leads(lead_stage);
create index if not exists idx_conversations_lead_id on public.conversations(lead_id);
create index if not exists idx_conversations_dealer_id on public.conversations(dealer_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — a dealer can only ever touch their own rows
-- ---------------------------------------------------------------------------
alter table public.dealers       enable row level security;
alter table public.stock         enable row level security;
alter table public.leads         enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "dealers_select_own" on public.dealers;
create policy "dealers_select_own" on public.dealers
  for select using (auth.uid() = id);

drop policy if exists "dealers_update_own" on public.dealers;
create policy "dealers_update_own" on public.dealers
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "stock_all_own" on public.stock;
create policy "stock_all_own" on public.stock
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

drop policy if exists "leads_all_own" on public.leads;
create policy "leads_all_own" on public.leads
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

drop policy if exists "conversations_all_own" on public.conversations;
create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

-- ---------------------------------------------------------------------------
-- Realtime — broadcast leads & conversations changes to the portal
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.leads;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null;
  end;
end $$;
