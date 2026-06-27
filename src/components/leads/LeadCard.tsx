"use client";

import { motion } from "framer-motion";
import { Car, Clock, BotOff } from "lucide-react";
import { ChannelBadge, TemperatureBadge } from "@/components/ui/Badge";
import { cn, timeAgo, truncate } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export function LeadCard({
  lead,
  carLabel,
  onClick,
  onDragStart,
  dragging,
}: {
  lead: Lead;
  carLabel?: string | null;
  onClick: () => void;
  onDragStart: () => void;
  dragging?: boolean;
}) {
  return (
    <motion.button
      layout
      layoutId={lead.id}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group w-full cursor-grab rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:border-brand/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-white">
          {lead.contact || "Unknown"}
        </span>
        <TemperatureBadge temperature={lead.lead_temperature} />
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <ChannelBadge channel={lead.channel} />
        {lead.ai_active === false && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">
            <BotOff className="h-3 w-3" /> AI off
          </span>
        )}
      </div>

      {lead.last_message && (
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          {truncate(lead.last_message, 60)}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-white/35">
        {carLabel ? (
          <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-accent-300">
            <Car className="h-3 w-3 shrink-0" />
            <span className="truncate">{carLabel}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          <Clock className="h-3 w-3" />
          {timeAgo(lead.last_contact ?? lead.created_at)}
        </span>
      </div>
    </motion.button>
  );
}
