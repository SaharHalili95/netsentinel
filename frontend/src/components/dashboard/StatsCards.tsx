"use client";

import { Monitor, Shield, Activity, Radar } from "lucide-react";
import type { DashboardData } from "@/types";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function StatsCards({ data }: { data: DashboardData }) {
  const { t, fmt } = useI18n();
  const cards = [
    {
      label: t("dashboard.totalDevices"),
      value: fmt.number(data.devices.total),
      sub: t("dashboard.online", { n: data.devices.online }),
      icon: Monitor,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("dashboard.activeAlerts"),
      value: fmt.number(data.alerts.total),
      sub: t("dashboard.critical", { n: data.alerts.critical }),
      icon: Shield,
      color: data.alerts.critical > 0 ? "text-red-400" : "text-green-400",
      bg: data.alerts.critical > 0 ? "bg-red-500/10" : "bg-green-500/10",
    },
    {
      label: t("dashboard.traffic"),
      value: fmt.bytes(data.traffic.total_bytes),
      sub: t("dashboard.suspicious", { n: data.traffic.suspicious_connections }),
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: t("dashboard.lastScan"),
      value: data.last_scan.started_at ? fmt.ago(data.last_scan.started_at) : t("dashboard.noScans"),
      sub: data.last_scan.started_at ? t("dashboard.devicesFound", { n: data.last_scan.devices_found }) : "",
      icon: Radar,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <li key={card.label} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 truncate text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
            </div>
            <div className={`rounded-lg ${card.bg} p-3`}>
              <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
