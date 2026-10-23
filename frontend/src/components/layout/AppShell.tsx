"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { I18nProvider, useI18n } from "@/lib/i18n/I18nProvider";
import { isDemo } from "@/lib/api";
import { applyPrefs, loadPrefs } from "@/lib/prefs";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DemoBanner from "./DemoBanner";
import LiveRegion from "./LiveRegion";

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => applyPrefs(loadPrefs()), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("app.skipToContent")}
      </a>
      {isDemo && <DemoBanner />}
      <div className="flex min-h-screen">
        <Sidebar open={menuOpen} onClose={closeMenu} />
        <div className="min-w-0 flex-1 lg:ps-64">
          <Header menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} toggleRef={toggleRef} />
          <main id="main" tabIndex={-1} className="p-4 outline-none sm:p-6">
            {children}
          </main>
        </div>
      </div>
      <LiveRegion />
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Shell>{children}</Shell>
    </I18nProvider>
  );
}
