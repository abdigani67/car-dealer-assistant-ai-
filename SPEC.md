# Runova Auto — Build Spec (v2, approved)

Multi-tenant SaaS portal for independent UK used-car dealerships.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (DB + Auth) · Vercel
**Libraries:** `@supabase/ssr`, framer-motion, lucide-react, recharts, papaparse, date-fns, sonner, clsx + tailwind-merge

## Brand
- Primary indigo `#5B4FE8` · Accent teal `#00C4B4` · Background `#0A0918`
- Dark theme throughout. White / light-grey text. Glassmorphism cards, indigo→teal gradients, micro-animations, visible focus rings.

## Auth & multi-tenancy
- Supabase email/password. **No public signup** — dealer accounts created manually.
- **`dealers.id` === Supabase auth user id.** RLS policies use `auth.uid() = dealer_id` directly (no join table).
- All `/dashboard/*` routes protected by middleware → redirect to `/login` if unauthenticated.
- RLS enforced on every table. `whatsapp_token` is **never** selected into any client component — server-only.

## Schema additions (migration `0001`)
- `leads.ai_active` — bool, default `true`
- `leads.interested_stock_id` — uuid, nullable, FK → `stock.id`
- `stock.archived_at` — timestamptz, nullable (null = active/available; timestamp = archived/sold)
- RLS policies (`auth.uid() = dealer_id`) for `dealers`, `stock`, `leads`, `conversations`.

## Pages
1. **Dashboard** `/dashboard` — stats cards (leads this month, hot leads, viewings booked, cars in stock) + **analytics** (lead-source breakdown, conversion funnel, avg response time, this-vs-last-month sparklines) + recent-10 leads table with colour-coded temperature badges.
2. **Leads** `/dashboard/leads` — 4-column Kanban (New / Contacted / Viewing Booked / Deal Closed). Cards: contact, channel badge, temperature badge, last-message preview (60 chars), time-since, **interested car** chip. Optimistic drag/stage moves. Click → conversation drawer (chat bubbles, manual staff reply, AI-active toggle, stage buttons, **matching-stock suggestions**).
3. **Stock Manager** `/dashboard/stock` — table, Add/Edit modal, soft-delete (sets `archived_at`), filter bar (make / fuel / available-only), CSV upload (client parse + preview → **server route** validates + bulk inserts → success/error count).
4. **Conversations** `/dashboard/conversations` — all conversations, most-recent first, search by contact/message, same drawer.
5. **Settings** `/dashboard/settings` — business name, WhatsApp number, booking link, AI tone dropdown (Professional/Friendly/No-nonsense → preset instructions), custom AI instructions (overrides preset), opening hours. Saves dealer row. `whatsapp_token` never touched client-side.

## Premium features included
- **#1 Lead↔Stock link** (`interested_stock_id`): car chip on cards + matching-stock suggestions in drawer.
- **#2 Dashboard analytics**: source breakdown, funnel, avg response time, month-vs-last sparklines (recharts).
- **#6 UX polish**: skeleton loaders, sonner toasts, optimistic Kanban moves.
- **#8 Realtime hot-lead toasts**: "🔥 New hot lead from WhatsApp".
- **#10 Premium dark design system**: glassmorphism, gradients, framer-motion, focus rings.

Deferred: #3 AI audit log, #4 auto temperature scoring, #5 token rotation UI, #7 days-in-inventory, #9 CSV export/feed.

## Cross-cutting
- Mobile responsive · collapsible sidebar · skeleton loading states · helpful empty states · error handling on every Supabase call · realtime subscriptions on `leads` + `conversations`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No hardcoded creds.
