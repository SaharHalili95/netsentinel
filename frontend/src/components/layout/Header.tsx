"use client";

import { useEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Languages, Menu, Wifi, WifiOff, FlaskConical } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { fetchAlertCounts, isDemo } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

export default function Header({ menuOpen, onToggleMenu, toggleRef }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { isConnected, lastMessage } = useWebSocket(isDemo ? null : undefined);
  const pathname = usePathname();
  const [openAlerts, setOpenAlerts] = useState<number | null>(null);

  useEffect(() => {
    fetchAlertCounts()
      .then((counts) => setOpenAlerts(counts.total ?? 0))
      .catch(() => setOpenAlerts(null));
  }, [pathname, lastMessage]);

  const status = isDemo ? t("app.demoData") : isConnected ? t("app.live") : t("app.offline");
  const StatusIcon = isDemo ? FlaskConical : isConnected ? Wifi : WifiOff;
  const statusColor = isDemo ? "text-yellow-400" : isConnected ? "text-green-400" : "text-red-400";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-6">
      <button
        ref={toggleRef}
        type="button"
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-controls="sidebar"
        aria-label={menuOpen ? t("app.closeMenu") : t("app.openMenu")}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="ms-auto flex items-center gap-1 sm:gap-3">
        <span className={`flex items-center gap-1.5 text-xs ${statusColor}`} title={t("app.connectionStatus", { status })}>
          <StatusIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t("app.connectionStatus", { status })}</span>
        </span>

        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "he" : "en")}
          aria-label={t("app.languageLabel")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span lang={locale === "en" ? "he" : "en"}>{t("app.language")}</span>
        </button>

        <Link
          href="/alerts"
          aria-label={openAlerts === null ? t("nav.alerts") : t("app.openAlertsBell", { n: openAlerts })}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {!!openAlerts && (
            <span
              aria-hidden="true"
              className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
            >
              {openAlerts}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
