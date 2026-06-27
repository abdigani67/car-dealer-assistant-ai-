import { cn } from "@/lib/utils";
import { CHANNEL_STYLES, TEMPERATURE_STYLES } from "@/lib/constants";
import type { Channel, LeadTemperature } from "@/lib/types";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel | null }) {
  if (!channel || !CHANNEL_STYLES[channel]) {
    return <Badge className="bg-white/10 text-white/60">Unknown</Badge>;
  }
  const s = CHANNEL_STYLES[channel];
  return <Badge className={s.className}>{s.label}</Badge>;
}

export function TemperatureBadge({
  temperature,
}: {
  temperature: LeadTemperature | null;
}) {
  if (!temperature || !TEMPERATURE_STYLES[temperature]) {
    return <Badge className="bg-white/10 text-white/60">—</Badge>;
  }
  const s = TEMPERATURE_STYLES[temperature];
  return (
    <Badge className={s.className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}
