"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCards";
import DeviceChart from "@/components/dashboard/DeviceChart";
import AlertsFeed from "@/components/dashboard/AlertsFeed";
import NetworkMap from "@/components/dashboard/NetworkMap";
import TrafficGraph from "@/components/dashboard/TrafficGraph";
import { fetchDashboard } from "@/lib/api";
import type { DashboardData } from "@/types";

const defaultData: DashboardData = {
  devices: { total: 0, online: 0, offline: 0, types: {} },
  alerts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
  last_scan: { id: null, type: null, status: null, devices_found: 0, started_at: null },
  traffic: { total_bytes: 0, suspicious_connections: 0 },
  recent_alerts: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const result = await fetchDashboard();
      setData(result);
    } catch {
      setError("Failed to connect to backend. Make sure the API is running.");
      // Use demo data on error
      setData({
        devices: { total: 5, online: 4, offline: 1, types: { unknown: 3, router: 1, mobile: 1 } },
        alerts: { critical: 1, high: 2, medium: 3, low: 1, info: 0, total: 7 },
        last_scan: { id: "demo", type: "discovery", status: "completed", devices_found: 5, started_at: new Date().toISOString() },
        traffic: { total_bytes: 1258000000, suspicious_connections: 2 },
        recent_alerts: [
          { id: "1", severity: "critical", title: "Suspicious port 4444 connection detected", status: "open", created_at: new Date().toISOString() },
          { id: "2", severity: "high", title: "New unknown device on network", status: "open", created_at: new Date(Date.now() - 300000).toISOString() },
          { id: "3", severity: "medium", title: "Connection to watchlist country: Germany", status: "open", created_at: new Date(Date.now() - 600000).toISOString() },
          { id: "4", severity: "medium", title: "Port 3389 (RDP) open on 192.168.1.100", status: "acknowledged", created_at: new Date(Date.now() - 1800000).toISOString() },
          { id: "5", severity: "low", title: "SSL certificate expiring in 7 days", status: "open", created_at: new Date(Date.now() - 3600000).toISOString() },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time network security overview
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          {error} — Showing demo data.
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards data={data} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Over Time */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Network Traffic (24h)
          </h3>
          <TrafficGraph />
        </div>

        {/* Device Types */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Device Types
          </h3>
          <DeviceChart types={data.devices.types} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Network Map */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Network Topology
          </h3>
          <NetworkMap />
        </div>

        {/* Alerts Feed */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Recent Alerts
          </h3>
          <AlertsFeed alerts={data.recent_alerts} />
        </div>
      </div>
    </div>
  );
}
