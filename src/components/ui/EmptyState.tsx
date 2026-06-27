import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
        <Icon className="h-7 w-7 text-brand-300" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-white/50">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
