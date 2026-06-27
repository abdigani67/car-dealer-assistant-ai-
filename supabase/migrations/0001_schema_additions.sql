-- Runova Auto — schema additions + Row Level Security
-- Model: dealers.id === Supabase auth user id. All RLS uses auth.uid() = dealer_id.
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- 1. New columns required by the portal
-- ---------------------------------------------------------------------------

-- AI toggle per lead (drawer toggle flips this)
alter table public.leads
  add column if not exists ai_active boolean not null default true;

-- Link a lead to the car they're interested in
alter table public.leads
  add column if not exists interested_stock_id uuid references public.stock(id) on delete set null;

-- Soft-delete / sold marker for stock (null = active/available)
alter table public.stock
  add column if not exists archived_at timestamptz;

-- Opening hours shown to the AI assistant (Settings page free-text field)
alter table public.dealers
  add column if not exists opening_hours text;

-- Helpful indexes
create index if not exists idx_stock_dealer_id on public.stock(dealer_id);
create index if not exists idx_leads_dealer_id on public.leads(dealer_id);
create index if not exists idx_leads_stage on public.leads(lead_stage);
create index if not exists idx_conversations_lead_id on public.conversations(lead_id);
create index if not exists idx_conversations_dealer_id on public.conversations(dealer_id);

-- ---------------------------------------------------------------------------
-- 2. Enable Row Level Security
-- ---------------------------------------------------------------------------

alter table public.dealers       enable row level security;
alter table public.stock         enable row level security;
alter table public.leads         enable row level security;
alter table public.conversations enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Policies — a dealer can only ever touch their own rows
--    dealers.id is the auth user id, so dealer_id = auth.uid() everywhere.
-- ---------------------------------------------------------------------------

-- dealers (own profile row; id is the auth uid)
drop policy if exists "dealers_select_own" on public.dealers;
create policy "dealers_select_own" on public.dealers
  for select using (auth.uid() = id);

drop policy if exists "dealers_update_own" on public.dealers;
create policy "dealers_update_own" on public.dealers
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- stock
drop policy if exists "stock_all_own" on public.stock;
create policy "stock_all_own" on public.stock
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

-- leads
drop policy if exists "leads_all_own" on public.leads;
create policy "leads_all_own" on public.leads
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

-- conversations
drop policy if exists "conversations_all_own" on public.conversations;
create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = dealer_id) with check (auth.uid() = dealer_id);

-- ---------------------------------------------------------------------------
-- 4. Realtime — make sure leads & conversations broadcast changes
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.conversations;
