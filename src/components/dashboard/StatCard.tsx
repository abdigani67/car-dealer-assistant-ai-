"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  accent = "brand",
  loading,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  delta?: number | null;
  accent?: "brand" | "accent" | "hot";
  loading?: boolean;
  index?: number;
}) {
  const accentClass =
    accent === "hot"
      ? "text-hot bg-hot/10 ring-hot/20"
      : accent === "accent"
        ? "text-accent-300 bg-accent/10 ring-accent/20"
        : "text-brand-300 bg-brand/10 ring-brand/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm text-white/50">{label}</span>
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1", accentClass)}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-3xl font-semibold tracking-tight text-white">
              {value}
            </span>
          )}
          {!loading && delta != null && Number.isFinite(delta) && (
            <span
              className={cn(
                "mb-1 inline-flex items-center gap-0.5 text-xs font-medium",
                delta >= 0 ? "text-accent-300" : "text-hot",
              )}
            >
              {delta >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
