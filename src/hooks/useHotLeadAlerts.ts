"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CHANNEL_STYLES } from "@/lib/constants";
import type { Lead } from "@/lib/types";

// App-wide realtime listener: fires a toast when a new hot lead arrives.
export function useHotLeadAlerts(dealerId: string | undefined) {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!dealerId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`hot-leads-${dealerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `dealer_id=eq.${dealerId}`,
        },
        (payload) => {
          const lead = payload.new as Lead;
          if (seen.current.has(lead.id)) return;
          seen.current.add(lead.id);
          if (lead.lead_temperature !== "hot") return;

          const channelLabel =
            (lead.channel && CHANNEL_STYLES[lead.channel]?.label) || "a channel";
          toast(`🔥 New hot lead from ${channelLabel}`, {
            description: lead.contact || "New enquiry just landed.",
            duration: 8000,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId]);
}
