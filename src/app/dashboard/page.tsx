"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Flame,
  CalendarCheck,
  Car,
  Clock,
  PieChart,
  Filter,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  ChannelDonut,
  ConversionFunnel,
  LeadsSparkline,
} from "@/components/dashboard/Analytics";
import { ChannelBadge, TemperatureBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  startOfLastMonthISO,
  startOfThisMonthISO,
  timeAgo,
  truncate,
} from "@/lib/utils";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";

interface DashData {
  leads: Lead[];
  stockCount: number;
  avgResponseMins: number | null;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const [leadsRes, stockRes, convRes] = await Promise.all([
        supabase
          .from("leads")
          .select(
            "id, contact, channel, lead_stage, lead_temperature, last_message, created_at, last_contact",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("stock")
          .select("id", { count: "exact", head: true })
          .eq("available", true)
          .is("archived_at", null),
        supabase
          .from("conversations")
          .select("lead_id, sender_type, timestamp")
          .order("timestamp", { ascending: true })
          .limit(2000),
      ]);

      if (!active) return;

      if (leadsRes.error || stockRes.error) {
        setError("Couldn't load your dashboard. Please refresh.");
        return;
      }

      // Average response time: first customer message → first ai/staff reply.
      const byLead = new Map<string, { ts: number; sender: string }[]>();
      for (const c of convRes.data ?? []) {
        const arr = byLead.get(c.lead_id) ?? [];
        arr.push({ ts: new Date(c.timestamp).getTime(), sender: c.sender_type });
        byLead.set(c.lead_id, arr);
      }
      const deltas: number[] = [];
      byLead.forEach((msgs) => {
        const firstUser = msgs.find((m) => m.sender === "user");
        if (!firstUser) return;
        const reply = msgs.find(
          (m) =>
            m.ts >= firstUser.ts && (m.sender === "ai" || m.sender === "staff"),
        );
        if (reply) deltas.push((reply.ts - firstUser.ts) / 60000);
      });
      const avgResponseMins =
        deltas.length > 0
          ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
          : null;

      setData({
        leads: (leadsRes.data as Lead[]) ?? [],
        stockCount: stockRes.count ?? 0,
        avgResponseMins,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;
    const { leads } = data;
    const thisMonth = startOfThisMonthISO();
    const lastMonth = startOfLastMonthISO();

    const leadsThisMonth = leads.filter((l) => l.created_at >= thisMonth);
    const leadsLastMonth = leads.filter(
      (l) => l.created_at >= lastMonth && l.created_at < thisMonth,
    );
    const hot = leads.filter((l) => l.lead_temperature === "hot");
    const viewings = leads.filter((l) => l.lead_stage === "viewing_booked");

    const stageCounts = LEAD_STAGES.reduce(
      (acc, s) => {
        acc[s.key] = leads.filter((l) => l.lead_stage === s.key).length;
        return acc;
      },
      {} as Record<LeadStage, number>,
    );

    const channelMap = new Map<string, number>();
    for (const l of leads) {
      const key = l.channel ?? "unknown";
      channelMap.set(key, (channelMap.get(key) ?? 0) + 1);
    }
    const channelData = Array.from(channelMap.entries())
      .map(([channel, value]) => ({ channel, value }))
      .sort((a, b) => b.value - a.value);

    // Last 30 days of daily lead counts for the sparkline.
    const days: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = leads.filter(
        (l) =>
          new Date(l.created_at) >= d && new Date(l.created_at) < next,
      ).length;
      days.push({
        day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        count,
      });
    }

    return {
      leadsThisMonth: leadsThisMonth.length,
      leadsDelta: pctDelta(leadsThisMonth.length, leadsLastMonth.length),
      hot: hot.length,
      viewings: viewings.length,
      stageCounts,
      channelData,
      days,
      recent: leads.slice(0, 10),
    };
  }, [data]);

  const loading = !data && !error;

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={Inbox}
          title="Something went wrong"
          description={error}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your dealership at a glance."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Leads this month"
          value={computed?.leadsThisMonth ?? 0}
          delta={computed?.leadsDelta}
          icon={Users}
          loading={loading}
        />
        <StatCard
          index={1}
          label="Hot leads"
          value={computed?.hot ?? 0}
          icon={Flame}
          accent="hot"
          loading={loading}
        />
        <StatCard
          index={2}
          label="Viewings booked"
          value={computed?.viewings ?? 0}
          icon={CalendarCheck}
          accent="accent"
          loading={loading}
        />
        <StatCard
          index={3}
          label="Cars in stock"
          value={data?.stockCount ?? 0}
          icon={Car}
          loading={loading}
        />
      </div>

      {/* Analytics */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">
              Leads · last 30 days
            </h3>
            {computed?.leadsDelta != null && (
              <span className="text-xs text-white/40">
                {computed.leadsDelta >= 0 ? "+" : ""}
                {computed.leadsDelta}% vs last month
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <LeadsSparkline data={computed!.days} />
          )}

          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-white/70">
              <Filter className="h-4 w-4 text-brand-300" /> Conversion funnel
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <ConversionFunnel counts={computed!.stageCounts} />
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-white/70">
              <PieChart className="h-4 w-4 text-accent-300" /> Lead sources
            </h3>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ChannelDonut data={computed!.channelData} />
            )}
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 ring-1 ring-brand/20">
              <Clock className="h-5 w-5 text-brand-300" />
            </span>
            <div>
              <p className="text-sm text-white/50">Avg. response time</p>
              {loading ? (
                <Skeleton className="mt-1 h-6 w-20" />
              ) : (
                <p className="text-xl font-semibold text-white">
                  {data?.avgResponseMins == null
                    ? "—"
                    : data.avgResponseMins < 60
                      ? `${data.avgResponseMins} min`
                      : `${(data.avgResponseMins / 60).toFixed(1)} hrs`}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent leads */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-sm font-medium text-white/70">Recent leads</h3>
        </div>

        {loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : computed!.recent.length === 0 ? (
          <EmptyState
            className="m-5 border-0"
            icon={Inbox}
            title="No leads yet"
            description="Your AI assistant will populate this automatically as enquiries come in."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/35">
                  <th className="px-5 py-2.5 font-medium">Contact</th>
                  <th className="px-5 py-2.5 font-medium">Channel</th>
                  <th className="px-5 py-2.5 font-medium">Temp.</th>
                  <th className="px-5 py-2.5 font-medium">Stage</th>
                  <th className="px-5 py-2.5 font-medium">Last message</th>
                  <th className="px-5 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {computed!.recent.map((l) => (
                  <tr
                    key={l.id}
                    className="border-t border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-medium text-white">
                      {l.contact || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <ChannelBadge channel={l.channel} />
                    </td>
                    <td className="px-5 py-3">
                      <TemperatureBadge temperature={l.lead_temperature} />
                    </td>
                    <td className="px-5 py-3 capitalize text-white/60">
                      {l.lead_stage?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-white/55">
                      {truncate(l.last_message, 48) || "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-white/40">
                      {timeAgo(l.last_contact ?? l.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
