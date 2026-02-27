"use client";

import { Monitor, Shield, Activity, Radar } from "lucide-react";
import type { DashboardData } from "@/types";
import { formatBytes } from "@/lib/utils";

interface StatsCardsProps {
  data: DashboardData;
}

export default function StatsCards({ data }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Devices",
      value: data.devices.total,
      sub: `${data.devices.online} online`,
      icon: Monitor,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Alerts",
      value: data.alerts.total,
      sub: `${data.alerts.critical} critical`,
      icon: Shield,
      color: data.alerts.critical > 0 ? "text-red-500" : "text-green-500",
      bg: data.alerts.critical > 0 ? "bg-red-500/10" : "bg-green-500/10",
    },
    {
      label: "Network Traffic",
      value: formatBytes(data.traffic.total_bytes),
      sub: `${data.traffic.suspicious_connections} suspicious`,
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Last Scan",
      value: data.last_scan.devices_found,
      sub: data.last_scan.status || "No scans yet",
      icon: Radar,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {card.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
            </div>
            <div className={`rounded-lg ${card.bg} p-3`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
