"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Globe, AlertTriangle, Activity } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

// Mock traffic data
const protocolData = [
  { name: "TCP", value: 8547, fill: "#3b82f6" },
  { name: "UDP", value: 2341, fill: "#8b5cf6" },
  { name: "ICMP", value: 156, fill: "#06b6d4" },
];

const topDestinations = [
  { ip: "8.8.8.8", country: "US", city: "Mountain View", bytes: 45200000, connections: 1250, service: "Google DNS" },
  { ip: "151.101.1.140", country: "US", city: "San Francisco", bytes: 32100000, connections: 890, service: "Reddit/Fastly" },
  { ip: "140.82.121.4", country: "US", city: "San Francisco", bytes: 28500000, connections: 567, service: "GitHub" },
  { ip: "17.253.144.10", country: "US", city: "Cupertino", bytes: 21800000, connections: 432, service: "Apple" },
  { ip: "54.230.210.45", country: "US", city: "Ashburn", bytes: 18900000, connections: 321, service: "AWS CloudFront" },
  { ip: "185.220.101.1", country: "DE", city: "Berlin", bytes: 2400000, connections: 12, service: "Unknown" },
];

const geoData = [
  { country: "United States", connections: 3460, bytes: 156000000, flag: "US" },
  { country: "Germany", connections: 12, bytes: 2400000, flag: "DE" },
  { country: "Australia", connections: 89, bytes: 8900000, flag: "AU" },
  { country: "Japan", connections: 45, bytes: 5600000, flag: "JP" },
  { country: "United Kingdom", connections: 67, bytes: 7800000, flag: "GB" },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function TrafficPage() {
  const [tab, setTab] = useState<"overview" | "geo" | "suspicious">("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Traffic Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Network traffic monitoring and geographic analysis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "overview", label: "Overview", icon: Activity },
          { key: "geo", label: "Geographic", icon: Globe },
          { key: "suspicious", label: "Suspicious", icon: AlertTriangle },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Protocol Distribution */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Protocol Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={protocolData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {protocolData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(224, 71%, 6%)", border: "1px solid hsl(216, 34%, 17%)", borderRadius: "8px", color: "hsl(213, 31%, 91%)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6">
              {protocolData.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.fill }} />
                  <span className="text-muted-foreground">{p.name}: {p.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Destinations */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Top Destinations
            </h3>
            <div className="space-y-3">
              {topDestinations.map((dest) => (
                <div key={dest.ip} className="flex items-center justify-between rounded-lg border border-border/50 bg-accent/20 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{dest.ip}</span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{dest.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{dest.service} &bull; {dest.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{formatBytes(dest.bytes)}</p>
                    <p className="text-xs text-muted-foreground">{dest.connections} conn.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "geo" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Traffic by Country
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" />
              <XAxis type="number" stroke="hsl(215, 20%, 45%)" fontSize={10} />
              <YAxis dataKey="country" type="category" stroke="hsl(215, 20%, 45%)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(224, 71%, 6%)", border: "1px solid hsl(216, 34%, 17%)", borderRadius: "8px", color: "hsl(213, 31%, 91%)" }} />
              <Bar dataKey="connections" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Country Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2">Country</th>
                  <th className="px-4 py-2">Connections</th>
                  <th className="px-4 py-2">Data Transfer</th>
                </tr>
              </thead>
              <tbody>
                {geoData.map((row) => (
                  <tr key={row.country} className="border-b border-border/50">
                    <td className="px-4 py-2 text-foreground">{row.flag} {row.country}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.connections.toLocaleString()}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatBytes(row.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "suspicious" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Suspicious Connections
            </h3>
            <div className="space-y-3">
              {topDestinations.filter((d) => d.service === "Unknown").map((dest) => (
                <div key={dest.ip} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">{dest.ip}</span>
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-500">{dest.country}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Unknown service • {dest.connections} connections • {dest.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-400">{formatBytes(dest.bytes)}</p>
                    <p className="text-xs text-muted-foreground">Port 4444</p>
                  </div>
                </div>
              ))}
              {topDestinations.filter((d) => d.service === "Unknown").length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No suspicious connections detected</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
