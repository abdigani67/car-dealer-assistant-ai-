"use client";

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LEAD_STAGES, type LeadStage } from "@/lib/types";

const CHANNEL_COLOURS: Record<string, string> = {
  whatsapp: "#25D366",
  web: "#3B82F6",
  email: "#8B8B9E",
  unknown: "#4B4663",
};

export function LeadsSparkline({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B4FE8" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#5B4FE8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "rgba(27,23,56,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          formatter={(v: number) => [`${v} leads`, ""]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#7A6CEC"
          strokeWidth={2}
          fill="url(#sparkFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ChannelDonut({
  data,
}: {
  data: { channel: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/30">No leads yet.</p>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <div className="h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="channel"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d) => (
                <Cell
                  key={d.channel}
                  fill={CHANNEL_COLOURS[d.channel] ?? CHANNEL_COLOURS.unknown}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(27,23,56,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [`${v}`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.channel} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: CHANNEL_COLOURS[d.channel] ?? CHANNEL_COLOURS.unknown,
              }}
            />
            <span className="flex-1 capitalize text-white/60">{d.channel}</span>
            <span className="font-medium text-white">{d.value}</span>
            <span className="w-10 text-right text-xs text-white/35">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConversionFunnel({
  counts,
}: {
  counts: Record<LeadStage, number>;
}) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="space-y-3">
      {LEAD_STAGES.map((s, i) => {
        const value = counts[s.key] ?? 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={s.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/55">{s.label}</span>
              <span className="font-medium text-white">{value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full",
                  i === LEAD_STAGES.length - 1
                    ? "bg-gradient-to-r from-accent-400 to-accent-300"
                    : "bg-brand-gradient",
                )}
                style={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
