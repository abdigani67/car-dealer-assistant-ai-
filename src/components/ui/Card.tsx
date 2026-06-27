import { cn } from "@/lib/utils";

// Glassmorphism surface used across the app.
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-white/[0.035] shadow-card backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
