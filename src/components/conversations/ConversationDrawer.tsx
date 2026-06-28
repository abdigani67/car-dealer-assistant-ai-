"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Bot, Car, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Field";
import { ChannelBadge, TemperatureBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { LEAD_STAGES, type Conversation, type Lead, type Stock } from "@/lib/types";

function budgetCeiling(budget: string | null): number | null {
  if (!budget) return null;
  const digits = budget.replace(/[, ]/g, "").match(/\d+(\.\d+)?k?/gi);
  if (!digits) return null;
  const nums = digits.map((d) =>
    d.toLowerCase().endsWith("k")
      ? parseFloat(d) * 1000
      : parseFloat(d),
  );
  return Math.max(...nums) || null;
}

export function ConversationDrawer({
  lead,
  open,
  onClose,
  onLeadPatch,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onLeadPatch?: (id: string, patch: Partial<Lead>) => void;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [matches, setMatches] = useState<Stock[]>([]);
  const [aiActive, setAiActive] = useState(true);
  const [stage, setStage] = useState(lead?.lead_stage ?? "new");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiActive(lead?.ai_active ?? true);
    setStage(lead?.lead_stage ?? "new");
  }, [lead]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, []);

  // Load messages + matching stock when a lead is opened.
  useEffect(() => {
    if (!open || !lead) return;
    let cancelled = false;
    setLoading(true);
    setMessages([]);

    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("lead_id", lead.id)
        .order("timestamp", { ascending: true });

      if (cancelled) return;
      if (error) {
        toast.error("Couldn't load this conversation.");
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
      scrollToBottom();
    })();

    (async () => {
      // Only ever suggest cars that are available and not archived/sold.
      const { data: available } = await supabase
        .from("stock")
        .select("*")
        .eq("dealer_id", lead.dealer_id)
        .eq("available", true)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;

      // Pool of candidates, excluding the car the lead is already looking at.
      let pool = (available ?? []).filter(
        (s) => s.id !== lead.interested_stock_id,
      );

      // Reference price: the interested car's price, else a parseable budget.
      let refPrice: number | null = null;
      if (lead.interested_stock_id) {
        const inPool = (available ?? []).find(
          (s) => s.id === lead.interested_stock_id,
        );
        if (inPool?.price != null) {
          refPrice = inPool.price;
        } else {
          // Interested car may itself be sold/archived — fetch its price anyway.
          const { data: interested } = await supabase
            .from("stock")
            .select("price")
            .eq("id", lead.interested_stock_id)
            .maybeSingle();
          if (cancelled) return;
          refPrice = interested?.price ?? null;
        }
      } else {
        refPrice = budgetCeiling(lead.budget);
      }

      let result: Stock[];
      if (refPrice != null) {
        const ref = refPrice;
        const priced = pool
          .filter((s) => s.price != null)
          .map((s) => ({ s, diff: Math.abs((s.price as number) - ref) }))
          .sort((a, b) => a.diff - b.diff);
        const inBand = priced.filter((p) => p.diff <= 4000);
        // Closest matches first; top up past the ±£4k band to reach 4 if needed.
        const base = (inBand.length >= 4 ? inBand : priced).map((p) => p.s);
        const unpriced = pool.filter((s) => s.price == null);
        result = [...base, ...unpriced].slice(0, 4);
      } else {
        // No reference price — fall back to the most recently added cars.
        result = pool.slice(0, 4);
      }

      setMatches(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, lead, supabase, scrollToBottom]);

  // Realtime — new messages for this lead.
  useEffect(() => {
    if (!open || !lead) return;
    const channel = supabase
      .channel(`conv-${lead.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `lead_id=eq.${lead.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Conversation;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
          scrollToBottom();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, lead, supabase, scrollToBottom]);

  async function sendReply() {
    if (!lead || !draft.trim()) return;
    setSending(true);
    const text = draft.trim();

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        lead_id: lead.id,
        dealer_id: lead.dealer_id,
        contact: lead.contact,
        sender_type: "staff",
        message_text: text,
      })
      .select()
      .single();

    if (error) {
      toast.error("Message failed to send.");
      setSending(false);
      return;
    }

    setMessages((prev) =>
      prev.some((m) => m.id === data.id) ? prev : [...prev, data],
    );
    await supabase
      .from("leads")
      .update({ last_message: text, last_contact: new Date().toISOString() })
      .eq("id", lead.id);
    onLeadPatch?.(lead.id, { last_message: text });
    setDraft("");
    setSending(false);
    scrollToBottom();
  }

  async function toggleAi(next: boolean) {
    if (!lead) return;
    setAiActive(next);
    const { error } = await supabase
      .from("leads")
      .update({ ai_active: next })
      .eq("id", lead.id);
    if (error) {
      setAiActive(!next);
      toast.error("Couldn't update AI status.");
      return;
    }
    onLeadPatch?.(lead.id, { ai_active: next });
    toast.success(next ? "AI re-enabled for this lead." : "AI paused for this lead.");
  }

  async function moveStage(next: typeof stage) {
    if (!lead || next === stage) return;
    const prev = stage;
    setStage(next);
    const { error } = await supabase
      .from("leads")
      .update({ lead_stage: next })
      .eq("id", lead.id);
    if (error) {
      setStage(prev);
      toast.error("Couldn't move stage.");
      return;
    }
    onLeadPatch?.(lead.id, { lead_stage: next });
  }

  return (
    <Drawer open={open} onClose={onClose}>
      {lead && (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/[0.07] px-5 pb-4 pt-5">
            <div className="flex items-center gap-2 pr-8">
              <h2 className="truncate text-base font-semibold text-white">
                {lead.contact || "Unknown contact"}
              </h2>
              <ChannelBadge channel={lead.channel} />
              <TemperatureBadge temperature={lead.lead_temperature} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {LEAD_STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => moveStage(s.key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                    stage === s.key
                      ? "bg-brand-gradient text-white"
                      : "bg-white/[0.06] text-white/55 hover:text-white",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-white/60">
                <Bot className="h-4 w-4 text-brand-300" />
                AI assistant
              </span>
              <Toggle checked={aiActive} onChange={toggleAi} />
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
                <Skeleton className="h-12 w-3/4 rounded-2xl" />
                <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="mb-2 h-6 w-6 text-white/30" />
                <p className="text-sm text-white/40">No messages yet.</p>
              </div>
            ) : (
              messages.map((m) => <Bubble key={m.id} message={m} />)
            )}

            {/* Matching stock suggestions */}
            {!loading && matches.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/35">
                  <Car className="h-3.5 w-3.5" /> Matching stock
                </p>
                <div className="space-y-1.5">
                  {matches.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1",
                        s.id === lead.interested_stock_id
                          ? "bg-brand/10 ring-brand/30"
                          : "bg-white/[0.03] ring-white/[0.06]",
                      )}
                    >
                      <span className="truncate text-white/80">
                        {[s.year, s.make, s.model].filter(Boolean).join(" ") ||
                          "Vehicle"}
                      </span>
                      <span className="ml-3 shrink-0 font-medium text-accent-300">
                        {formatPrice(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/[0.07] p-3">
            <div className="flex items-end gap-2 rounded-xl bg-ink-900/70 p-1.5 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-brand-400">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                rows={1}
                placeholder="Type a reply as staff…"
                className="max-h-32 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <Button
                size="icon"
                onClick={sendReply}
                loading={sending}
                disabled={!draft.trim()}
                aria-label="Send"
              >
                {!sending && <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-white/30">
              Sent as staff · last contact {timeAgo(lead.last_contact)}
            </p>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Bubble({ message }: { message: Conversation }) {
  const mine = message.sender_type === "user"; // customer messages on the left
  const isStaff = message.sender_type === "staff";
  const isAi = message.sender_type === "ai";

  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            mine && "rounded-tl-sm bg-white/[0.07] text-white/90",
            isAi && "rounded-tr-sm bg-brand-gradient text-white",
            isStaff && "rounded-tr-sm bg-[#6E59C7] text-white",
          )}
        >
          {message.message_text}
        </div>
        <p
          className={cn(
            "mt-1 px-1 text-[10px] text-white/30",
            mine ? "text-left" : "text-right",
          )}
        >
          {isAi ? "AI" : isStaff ? "Staff" : "Customer"} · {timeAgo(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
