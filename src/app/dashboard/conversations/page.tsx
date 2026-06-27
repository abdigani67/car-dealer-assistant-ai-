"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ConversationDrawer } from "@/components/conversations/ConversationDrawer";
import { ChannelBadge, TemperatureBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { initials, timeAgo, truncate } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export default function ConversationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [query, setQuery] = useState("");
  const [matchedLeadIds, setMatchedLeadIds] = useState<Set<string> | null>(null);
  const [active, setActive] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("last_contact", { ascending: false, nullsFirst: false });
    if (error) {
      toast.error("Couldn't load conversations.");
      setLeads([]);
      return;
    }
    setLeads((data as Lead[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — bump a lead to the top when a new message lands.
  useEffect(() => {
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((prev) =>
            prev
              ? prev.map((l) =>
                  l.id === (payload.new as Lead).id ? (payload.new as Lead) : l,
                )
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Deep search across message bodies (debounced).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatchedLeadIds(null);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("conversations")
        .select("lead_id")
        .ilike("message_text", `%${q}%`)
        .limit(500);
      if (!active) return;
      setMatchedLeadIds(new Set((data ?? []).map((r) => r.lead_id)));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, supabase]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const inContact = l.contact?.toLowerCase().includes(q);
      const inLast = l.last_message?.toLowerCase().includes(q);
      const inBody = matchedLeadIds?.has(l.id);
      return inContact || inLast || inBody;
    });
  }, [leads, query, matchedLeadIds]);

  const loading = leads === null;

  return (
    <>
      <PageHeader
        title="Conversations"
        subtitle="Every thread across all your leads, newest first."
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by contact or message…"
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="m-4 border-0"
            icon={MessagesSquare}
            title={query ? "No matches" : "No conversations yet"}
            description={
              query
                ? "Try a different contact number or keyword."
                : "Once your AI starts chatting with leads, every thread will appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {filtered.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => setActive(l)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] focus:outline-none focus-visible:bg-white/[0.04]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
                    {initials(l.contact)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {l.contact || "Unknown"}
                      </span>
                      <ChannelBadge channel={l.channel} />
                      <TemperatureBadge temperature={l.lead_temperature} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/45">
                      {truncate(l.last_message, 80) || "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-white/35">
                    {timeAgo(l.last_contact ?? l.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConversationDrawer
        lead={active}
        open={!!active}
        onClose={() => setActive(null)}
        onLeadPatch={(id, patch) =>
          setLeads((prev) =>
            prev ? prev.map((l) => (l.id === id ? { ...l, ...patch } : l)) : prev,
          )
        }
      />
    </>
  );
}
