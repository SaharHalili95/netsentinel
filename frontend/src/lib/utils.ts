import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Locale = "en" | "he";

const INTL_LOCALE: Record<Locale, string> = { en: "en-IL", he: "he-IL" };

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 }).format(n);
}

export function formatBytes(bytes: number, locale: Locale): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${formatNumber(bytes / Math.pow(k, i), locale)} ${sizes[i]}`;
}

export function formatDate(date: string, locale: Locale): string {
  return new Date(date).toLocaleString(INTL_LOCALE[locale], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: string, locale: Locale): string {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "text-red-500 bg-red-500/10 border-red-500/20",
    high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    low: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    info: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };
  return colors[severity] || colors.info;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "text-red-400",
    acknowledged: "text-yellow-400",
    resolved: "text-green-400",
    online: "text-green-400",
    offline: "text-slate-500",
    running: "text-blue-400",
    completed: "text-green-400",
    failed: "text-red-400",
  };
  return colors[status] || "text-slate-400";
}
