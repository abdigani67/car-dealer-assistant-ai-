# Runova Auto

Multi-tenant SaaS portal for independent UK used-car dealerships. AI-assisted
lead management, stock control, and live conversations — built on Next.js 14,
Tailwind CSS and Supabase.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — custom dark theme (indigo `#5B4FE8` → teal `#00C4B4`)
- **Supabase** — Postgres, Auth, Row Level Security, Realtime
- **framer-motion**, **recharts**, **sonner**, **lucide-react**, **papaparse**

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

No service-role key is used or required. The `whatsapp_token` column is read
**only** inside server-side Route Handlers and is never selected into client code.

## Database setup

Run the migration in `supabase/migrations/0001_init.sql` against your project
(Supabase SQL editor or `supabase db push`). It:

1. Creates the `dealers`, `stock`, `leads` and `conversations` tables (including
   `leads.ai_active`, `leads.interested_stock_id`, `stock.archived_at`,
   `dealers.opening_hours`).
2. Enables Row Level Security and adds policies so each dealer can only read and
   write their own rows (`auth.uid() = dealer_id`).
3. Adds `leads` and `conversations` to the realtime publication.

### Auth model

`dealers.id` **is** the Supabase Auth user id. When you create a dealer account in
Supabase Auth, insert a matching `dealers` row using that same uuid as the primary
key. All RLS policies use `auth.uid() = dealer_id` directly — there is no join
table. There is no public signup; accounts are provisioned manually.

## Pages

| Route | Description |
| --- | --- |
| `/login` | Email/password sign-in (no signup) |
| `/dashboard` | Stats, analytics (sources, funnel, response time, trend), recent leads |
| `/dashboard/leads` | Kanban board with drag-to-stage + conversation drawer |
| `/dashboard/stock` | Stock table, add/edit modal, CSV import, filters |
| `/dashboard/conversations` | All threads, searchable, same drawer |
| `/dashboard/settings` | Business details + AI tone/instructions |

## Deploying to Vercel

1. Import the repo into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Add your Vercel domain to Supabase **Auth → URL Configuration**.
4. Deploy.

## Security notes

- Row Level Security isolates every dealer's data at the database layer.
- All `/dashboard` routes are guarded by middleware; unauthenticated requests
  redirect to `/login`.
- The CSV bulk import runs server-side (`/api/stock/import`); `dealer_id` comes
  from the authenticated session, never the client.
- `whatsapp_token` is never exposed to the browser.
