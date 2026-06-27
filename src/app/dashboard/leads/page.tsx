"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { LeadCard } from "@/components/leads/LeadCard";
import { ConversationDrawer } from "@/components/conversations/ConversationDrawer";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { LEAD_STAGES, type Lead, type LeadStage, type Stock } from "@/lib/types";

export default function LeadsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [carLabels, setCarLabels] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Lead | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);

  const load = useCallback(async () => {
    const [leadsRes, stockRes] = await Promise.all([
      supabase.from("leads").select("*").order("last_contact", {
        ascending: false,
        nullsFirst: false,
      }),
      supabase
        .from("stock")
        .select("id, make, model, year")
        .returns<Pick<Stock, "id" | "make" | "model" | "year">[]>(),
    ]);

    if (leadsRes.error) {
      toast.error("Couldn't load leads.");
      setLeads([]);
      return;
    }
    setLeads((leadsRes.data as Lead[]) ?? []);

    const labels: Record<string, string> = {};
    for (const s of stockRes.data ?? []) {
      labels[s.id] = [s.year, s.make, s.model].filter(Boolean).join(" ");
    }
    setCarLabels(labels);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — keep the board live.
  useEffect(() => {
    const channel = supabase
      .channel("leads-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          setLeads((prev) => {
            if (!prev) return prev;
            if (payload.eventType === "INSERT") {
              const next = payload.new as Lead;
              return prev.some((l) => l.id === next.id) ? prev : [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((l) =>
                l.id === (payload.new as Lead).id ? (payload.new as Lead) : l,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((l) => l.id !== (payload.old as Lead).id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const patchLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === id ? { ...l, ...patch } : l)) : prev,
    );
    setActive((a) => (a && a.id === id ? { ...a, ...patch } : a));
  }, []);

  async function dropTo(stage: LeadStage) {
    setDragOver(null);
    const id = dragId;
    setDragId(null);
    if (!id || !leads) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.lead_stage === stage) return;

    const prevStage = lead.lead_stage;
    patchLead(id, { lead_stage: stage }); // optimistic

    const { error } = await supabase
      .from("leads")
      .update({ lead_stage: stage })
      .eq("id", id);

    if (error) {
      patchLead(id, { lead_stage: prevStage });
      toast.error("Couldn't move lead.");
    }
  }

  const loading = leads === null;
  const isEmpty = !loading && leads!.length === 0;

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Drag cards between stages. Click to open the conversation."
      />

      {isEmpty ? (
        <EmptyState
          icon={LayoutGrid}
          title="No leads yet"
          description="Your AI will populate this board automatically as new enquiries arrive."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LEAD_STAGES.map((col) => {
            const items = (leads ?? []).filter(
              (l) => (l.lead_stage ?? "new") === col.key,
            );
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.key);
                }}
                onDragLeave={() => setDragOver((s) => (s === col.key ? null : s))}
                onDrop={() => dropTo(col.key)}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white/[0.015] p-3 transition",
                  dragOver === col.key
                    ? "border-brand/50 bg-brand/[0.06]"
                    : "border-white/[0.06]",
                )}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-white">{col.label}</h3>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/45">
                    {loading ? "·" : items.length}
                  </span>
                </div>

                <div className="flex min-h-[120px] flex-1 flex-col gap-2">
                  {loading ? (
                    <>
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                    </>
                  ) : items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-white/25">
                      Nothing here yet
                    </p>
                  ) : (
                    items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        carLabel={
                          lead.interested_stock_id
                            ? carLabels[lead.interested_stock_id]
                            : null
                        }
                        dragging={dragId === lead.id}
                        onDragStart={() => setDragId(lead.id)}
                        onClick={() => setActive(lead)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConversationDrawer
        lead={active}
        open={!!active}
        onClose={() => setActive(null)}
        onLeadPatch={patchLead}
      />
    </>
  );
}
