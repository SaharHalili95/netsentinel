import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { en } from "./en";
import { he } from "./he";
import { I18nProvider, useI18n } from "./I18nProvider";
import { timeAgo, formatBytes } from "@/lib/utils";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => <I18nProvider>{children}</I18nProvider>;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
  document.documentElement.dir = "";
});

describe("translations", () => {
  it("he has every en key and no extra ones", () => {
    expect(keys(he).sort()).toEqual(keys(en).sort());
  });

  it("no translation is empty", () => {
    const values = (obj: object): string[] =>
      Object.values(obj).flatMap((v) => (typeof v === "object" ? values(v) : [v]));
    expect(values(he).filter((v) => !v.trim())).toEqual([]);
  });
});

describe("I18nProvider", () => {
  it("defaults to English and ltr", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(result.current.t("nav.dashboard")).toBe("Dashboard");
  });

  it("t interpolates {n}", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t("alerts.openCount", { n: 3 })).toBe("3 open alerts need attention");
  });

  it("persists locale and sets dir=rtl", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => result.current.setLocale("he"));

    expect(localStorage.getItem("ns-locale")).toBe("he");
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    expect(result.current.t("nav.dashboard")).toBe(he.nav.dashboard);
  });

  it("restores the saved locale on the next visit", () => {
    localStorage.setItem("ns-locale", "he");
    function Title() {
      return <h1>{useI18n().t("nav.dashboard")}</h1>;
    }

    render(<Title />, { wrapper });

    expect(screen.getByRole("heading").textContent).toBe(he.nav.dashboard);
  });
});

describe("formatters", () => {
  it("timeAgo in he uses Hebrew relative time", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();

    expect(timeAgo(fiveMinutesAgo, "en")).toBe("5 minutes ago");
    expect(timeAgo(fiveMinutesAgo, "he")).toBe("לפני 5 דקות");
  });

  it("formatBytes keeps the unit after the number, isolated as LTR in Hebrew", () => {
    expect(formatBytes(0, "en")).toBe("0 B");
    expect(formatBytes(1536, "en")).toBe("1.5 KB");
    expect(formatBytes(1_258_000_000, "he")).toBe("\u20661.2 GB\u2069");
  });
});
