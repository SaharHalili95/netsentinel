"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartFigure from "@/components/ui/ChartFigure";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TrafficSummary } from "@/types";
import { axisColor, gridColor, tooltipStyle } from "./chartTheme";

export default function TrafficGraph({ hourly }: { hourly: TrafficSummary["hourly"] }) {
  const { t, fmt, locale } = useI18n();
  const hourLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === "he" ? "he-IL" : "en-IL", { hour: "2-digit", minute: "2-digit" });
  const data = hourly.map((h) => ({
    time: hourLabel(h.hour),
    inbound: h.inbound_bytes,
    outbound: h.outbound_bytes,
    suspicious: h.suspicious,
  }));

  return (
    <ChartFigure
      title={t("dashboard.trafficChart")}
      description={t("dashboard.trafficChartDesc")}
      columns={[t("dashboard.hour"), t("dashboard.inbound"), t("dashboard.outbound"), t("dashboard.suspiciousSeries")]}
      rows={data.map((d) => [d.time, fmt.bytes(d.inbound), fmt.bytes(d.outbound), d.suspicious])}
    >
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" stroke={axisColor} fontSize={10} tickLine={false} minTickGap={24} />
            <YAxis yAxisId="bytes" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} width={64} tickFormatter={fmt.bytes} />
            <YAxis yAxisId="count" orientation="right" hide />
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => (name === t("dashboard.suspiciousSeries") ? v : fmt.bytes(Number(v)))} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Area yAxisId="bytes" type="monotone" dataKey="inbound" name={t("dashboard.inbound")} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
            <Area yAxisId="bytes" type="monotone" dataKey="outbound" name={t("dashboard.outbound")} stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeWidth={2} />
            <Area yAxisId="count" type="step" dataKey="suspicious" name={t("dashboard.suspiciousSeries")} stroke="#f87171" fill="#f87171" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFigure>
  );
}
