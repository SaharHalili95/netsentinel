"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Radar,
  Bell,
  Activity,
  ClipboardCheck,
  BookOpen,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";

const navItems = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/devices", key: "nav.devices", icon: Monitor },
  { href: "/scans", key: "nav.scans", icon: Radar },
  { href: "/alerts", key: "nav.alerts", icon: Bell },
  { href: "/traffic", key: "nav.traffic", icon: Activity },
  { href: "/compliance", key: "nav.compliance", icon: ClipboardCheck },
  { href: "/how-it-works", key: "nav.howItWorks", icon: BookOpen },
  { href: "/settings", key: "nav.settings", icon: Settings },
];

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/$/, "") : path);

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = normalize(usePathname() ?? "/");
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside
        id="sidebar"
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-border bg-card transition-transform motion-reduce:transition-none lg:visible lg:translate-x-0",
          open ? "visible translate-x-0" : "invisible ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
          <div>
            <p className="text-lg font-bold text-foreground">{t("app.name")}</p>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>

        <nav aria-label={t("app.mainNav")} className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
