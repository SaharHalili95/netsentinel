"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Eye, XCircle, Info, ShieldCheck } from "lucide-react";
import { fetchAlerts, updateAlert, resolveAllAlerts } from "@/lib/api";
import { cn, severityColor, statusColor, formatDate, timeAgo } from "@/lib/utils";
import type { Alert } from "@/types";

const mockAlerts: Alert[] = [
  { id: "1", device_id: null, alert_type: "suspicious_port", severity: "critical", title: "Suspicious port 4444 connection from 192.168.1.150", description: "Device 192.168.1.150 connected to suspicious port 4444 on 185.220.101.1. This port is commonly used by Meterpreter.", status: "open", source_ip: "192.168.1.150", resolved_at: null, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: "2", device_id: null, alert_type: "new_device", severity: "high", title: "New unknown device discovered: 192.168.1.150", description: "A new device was found on the network. IP: 192.168.1.150, MAC: AA:BB:CC:DD:EE:05, Hostname: N/A", status: "open", source_ip: "192.168.1.150", resolved_at: null, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: "3", device_id: null, alert_type: "watchlist_country", severity: "medium", title: "Connection to watchlist country: Germany", description: "Device 192.168.1.150 communicated with 185.220.101.1 in Germany (Berlin)", status: "open", source_ip: "192.168.1.150", resolved_at: null, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: "4", device_id: null, alert_type: "open_port", severity: "medium", title: "Port 3389 (RDP) open on 192.168.1.100", description: "Potentially risky port 3389 (Remote Desktop) detected open on device desktop-pc", status: "acknowledged", source_ip: "192.168.1.100", resolved_at: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "5", device_id: null, alert_type: "open_port", severity: "low", title: "Port 22 (SSH) open on 192.168.1.100", description: "SSH service detected on desktop-pc. Ensure strong authentication is configured.", status: "resolved", source_ip: "192.168.1.100", resolved_at: new Date(Date.now() - 1800000).toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() },
];

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts({ limit: 50 });
      setAlerts(data);
    } catch {
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAlert(id, { status });
    } catch {
      // fallback
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Alert["status"] } : a))
    );
  };

  const handleResolveAll = async () => {
    try {
      await resolveAllAlerts();
    } catch {
      // fallback
    }
    setAlerts((prev) => prev.map((a) => ({ ...a, status: "resolved" as const })));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "active") return a.status !== "resolved";
    return a.severity === filter;
  });

  const openCount = alerts.filter((a) => a.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open alerts requiring attention
          </p>
        </div>
        {openCount > 0 && (
          <button
            onClick={handleResolveAll}
            className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Resolve All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "critical", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const Icon = severityIcons[alert.severity] || Info;
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                severityColor(alert.severity),
                alert.status === "resolved" && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{alert.title}</h3>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium uppercase", severityColor(alert.severity))}>
                      {alert.severity}
                    </span>
                    <span className={cn("text-xs", statusColor(alert.status))}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{timeAgo(alert.created_at)}</span>
                    {alert.source_ip && <span>Source: {alert.source_ip}</span>}
                    <span className="capitalize">{alert.alert_type.replace("_", " ")}</span>
                  </div>
                </div>
                {alert.status !== "resolved" && (
                  <div className="flex gap-1 flex-shrink-0">
                    {alert.status === "open" && (
                      <button
                        onClick={() => handleStatusChange(alert.id, "acknowledged")}
                        className="rounded-lg p-2 text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                        title="Acknowledge"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(alert.id, "resolved")}
                      className="rounded-lg p-2 text-green-500 hover:bg-green-500/10 transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredAlerts.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-border text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              No alerts matching this filter
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
