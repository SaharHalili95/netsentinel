"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Ltr from "@/components/ui/Ltr";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";
import type { Locale } from "@/lib/utils";

// Mirrors backend/app/config.py and backend/app/tasks/scheduler.py.
const SERVER_SETTINGS = { network: "192.168.1.0/24", discovery: 5, portScan: 60, capture: 2 };

const RULES = ["ruleNewDevice", "rulePort", "ruleCountry", "ruleSpike"];

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [prefs, setPrefs] = useState<Prefs>({ reduceMotion: false });

  useEffect(() => setPrefs(loadPrefs()), []);

  const updatePrefs = (next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <section aria-labelledby="display" className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="display" className="text-sm font-semibold text-foreground">{t("settings.display")}</h2>
          <span className="text-xs text-muted-foreground">{t("settings.savedLocally")}</span>
        </div>

        <div>
          <label htmlFor="language" className="mb-1 block text-sm text-muted-foreground">{t("settings.language")}</label>
          <select
            id="language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="en">English</option>
            <option value="he">עברית</option>
          </select>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="reduce-motion"
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(e) => updatePrefs({ ...prefs, reduceMotion: e.target.checked })}
            aria-describedby="reduce-motion-hint"
            className="mt-0.5 h-4 w-4 rounded border-border bg-background accent-[hsl(var(--primary))]"
          />
          <div>
            <label htmlFor="reduce-motion" className="text-sm text-foreground">{t("settings.reduceMotion")}</label>
            <p id="reduce-motion-hint" className="text-xs text-muted-foreground">{t("settings.reduceMotionHint")}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="scanning" className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 id="scanning" className="text-sm font-semibold text-foreground">{t("settings.scanning")}</h2>
        <p className="text-xs text-muted-foreground">{t("settings.serverNote")}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("settings.network")}</dt>
            <dd className="text-foreground"><Ltr>{SERVER_SETTINGS.network}</Ltr></dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.discoveryInterval")}</dt>
            <dd className="text-foreground">{t("settings.everyMinutes", { n: SERVER_SETTINGS.discovery })}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.portScanInterval")}</dt>
            <dd className="text-foreground">{t("settings.everyMinutes", { n: SERVER_SETTINGS.portScan })}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("settings.captureInterval")}</dt>
            <dd className="text-foreground">{t("settings.everyMinutes", { n: SERVER_SETTINGS.capture })}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="rules" className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 id="rules" className="text-sm font-semibold text-foreground">{t("settings.rules")}</h2>
        <ul className="space-y-2">
          {RULES.map((rule) => (
            <li key={rule} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">{t(`settings.${rule}`)}</span>
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {t("settings.enabled")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
