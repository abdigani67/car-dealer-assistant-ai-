import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "3 hours ago" / "just now" — tolerant of null & bad input.
export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function truncate(text: string | null | undefined, max = 60): string {
  if (!text) return "";
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return GBP.format(value);
}

export function formatMileage(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("en-GB").format(value)} mi`;
}

export function initials(text: string | null | undefined): string {
  if (!text) return "?";
  const cleaned = text.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!cleaned) return text.slice(-2).toUpperCase();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Start of the current month, ISO — used for "this month" stats.
export function startOfThisMonthISO(now = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function startOfLastMonthISO(now = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
}
