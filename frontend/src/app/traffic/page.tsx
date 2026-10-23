"use client";

import { useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Globe, AlertTriangle, Activity } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import ChartFigure from "@/components/ui/ChartFigure";
import Ltr from "@/components/ui/Ltr";
import { COLORS, axisColor, gridColor, tooltipStyle } from "@/components/dashboard/chartTheme";
import { fetchTrafficSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TrafficSummary } from "@/types";

const TABS = [
  { key: "overview", icon: Activity },
  { key: "geo", icon: Globe },
  { key: "suspicious", icon: AlertTriangle },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function TrafficPage() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useAsync(() => fetchTrafficSummary(24));
  const [tab, setTab] = useState<Tab>("overview");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const forward = document.documentElement.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = forward === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
    if (e.key !== forward && e.key !== back) return;
    e.preventDefault();
    const next = (index + (e.key === forward ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("traffic.title")} subtitle={t("traffic.subtitle")} onRefresh={reload} loading={loading} />
      {error ? <ErrorState onRetry={reload} /> : null}

      {data && (
        <>
          <div role="tablist" aria-label={t("traffic.tabs")} className="flex flex-wrap gap-2">
            {TABS.map((item, i) => (
              <button
                key={item.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`tab-${item.key}`}
                role="tab"
                type="button"
                aria-selected={tab === item.key}
                aria-controls={`panel-${item.key}`}
                tabIndex={tab === item.key ? 0 : -1}
                onClick={() => setTab(item.key)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  tab === item.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {t(`traffic.${item.key}`)}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
            {data.total_bytes === 0 ? (
              <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">{t("traffic.empty")}</p>
            ) : tab === "overview" ? (
              <Overview data={data} />
            ) : tab === "geo" ? (
              <ByCountry data={data} />
            ) : (
              <Suspicious data={data} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Overview({ data }: { data: TrafficSummary }) {
  const { t, fmt } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartFigure
        title={t("traffic.protocols")}
        columns={[t("traffic.protocols"), t("traffic.connections")]}
        rows={data.protocols.map((p) => [p.protocol, p.connections])}
      >
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data.protocols} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="connections" nameKey="protocol" paddingAngle={4}>
              {data.protocols.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex flex-wrap justify-center gap-4">
          {data.protocols.map((p, i) => (
            <li key={p.protocol} className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">
                {p.protocol}: {fmt.number(p.connections)}
              </span>
            </li>
          ))}
        </ul>
      </ChartFigure>

      <section aria-labelledby="top-destinations" className="rounded-xl border border-border bg-card p-5">
        <h2 id="top-destinations" className="mb-4 text-sm font-semibold text-foreground">{t("traffic.topDestinations")}</h2>
        <ul className="space-y-2">
          {data.top_destinations.map((d) => (
            <li key={d.ip} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-accent/20 p-3">
              <div className="min-w-0">
                <Ltr className="text-sm text-foreground">{d.ip}</Ltr>
                <p className="truncate text-xs text-muted-foreground">{[d.city, d.country].filter(Boolean).join(", ") || t("common.unknown")}</p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-sm text-foreground">{fmt.bytes(d.bytes)}</p>
                <p className="text-xs text-muted-foreground">
                  {fmt.number(d.connections)} {t("traffic.connections")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ByCountry({ data }: { data: TrafficSummary }) {
  const { t, fmt } = useI18n();
  return (
    <div className="space-y-6">
      <ChartFigure
        title={t("traffic.byCountry")}
        columns={[t("traffic.country"), t("traffic.connections"), t("traffic.data")]}
        rows={data.countries.map((c) => [c.country, c.connections, fmt.bytes(c.bytes)])}
      >
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={Math.max(160, data.countries.length * 44)}>
            <BarChart data={data.countries} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" stroke={axisColor} fontSize={10} />
              <YAxis dataKey="country" type="category" stroke={axisColor} fontSize={11} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="connections" name={t("traffic.connections")} fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartFigure>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("traffic.byCountry")}</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 text-start">{t("traffic.country")}</th>
              <th scope="col" className="px-4 py-2 text-start">{t("traffic.connections")}</th>
              <th scope="col" className="px-4 py-2 text-start">{t("traffic.data")}</th>
            </tr>
          </thead>
          <tbody>
            {data.countries.map((c) => (
              <tr key={c.country} className="border-b border-border/50">
                <td className="px-4 py-2 text-foreground">{c.country}</td>
                <td className="px-4 py-2 text-muted-foreground">{fmt.number(c.connections)}</td>
                <td className="px-4 py-2 text-muted-foreground">{fmt.bytes(c.bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Suspicious({ data }: { data: TrafficSummary }) {
  const { t, fmt } = useI18n();
  return (
    <section aria-labelledby="suspicious-title" className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
      <h2 id="suspicious-title" className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-400">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {t("traffic.suspiciousTitle")}
      </h2>
      {data.suspicious.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("traffic.noSuspicious")}</p>
      ) : (
        <ul className="space-y-3">
          {data.suspicious.map((s) => (
            <li key={`${s.destination_ip}:${s.destination_port}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div>
                <Ltr className="text-sm font-medium text-foreground">{s.destination_ip}</Ltr>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[s.city, s.country].filter(Boolean).join(", ") || t("common.unknown")} · {fmt.number(s.connections)} {t("traffic.connections")}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm font-medium text-red-300">{fmt.bytes(s.bytes)}</p>
                {s.destination_port != null && <p className="text-xs text-muted-foreground">{t("traffic.port", { port: s.destination_port })}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
