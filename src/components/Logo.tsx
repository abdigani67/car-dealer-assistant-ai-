import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M4 14.5 6 9a3 3 0 0 1 2.8-2h6.4A3 3 0 0 1 18 9l2 5.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="3"
            y="13.5"
            width="18"
            height="5.5"
            rx="2"
            stroke="white"
            strokeWidth="1.8"
          />
          <circle cx="7.5" cy="19" r="1.4" fill="white" />
          <circle cx="16.5" cy="19" r="1.4" fill="white" />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-white">
          Runova<span className="text-gradient"> Auto</span>
        </span>
      )}
    </div>
  );
}
