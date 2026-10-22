"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type Messages } from "./en";
import { he } from "./he";
import { formatBytes, formatDate, formatNumber, timeAgo, type Locale } from "@/lib/utils";

const MESSAGES: Record<Locale, Messages> = { en, he };
const STORAGE_KEY = "ns-locale";

type Vars = Record<string, string | number>;

interface I18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Vars) => string;
  fmt: {
    date: (iso: string) => string;
    ago: (iso: string) => string;
    bytes: (n: number) => string;
    number: (n: number) => string;
  };
}

const I18nContext = createContext<I18n | null>(null);

function lookup(messages: Messages, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages);
  return typeof value === "string" ? value : undefined;
}

function readSavedLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === "he" ? "he" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => setLocaleState(readSavedLocale()), []);

  const dir = locale === "he" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice still applies for this visit.
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const t = (key: string, vars?: Vars) => {
      const text = lookup(MESSAGES[locale], key) ?? lookup(en, key) ?? key;
      return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : text;
    };
    return {
      locale,
      dir,
      setLocale,
      t,
      fmt: {
        date: (iso) => formatDate(iso, locale),
        ago: (iso) => timeAgo(iso, locale),
        bytes: (n) => formatBytes(n, locale),
        number: (n) => formatNumber(n, locale),
      },
    };
  }, [locale, dir, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
