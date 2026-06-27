import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl bg-ink-900/60 px-3.5 text-sm text-white placeholder:text-white/30 ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-brand-400";

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium text-white/60", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "py-2.5", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(base, "h-10 appearance-none pr-9", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-full disabled:opacity-50",
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-brand-gradient" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-sm text-white/70">{label}</span>}
    </button>
  );
}
