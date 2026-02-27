"use client";

import { useEffect, useState } from "react";
import { Radar, Play, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { fetchScans, createScan } from "@/lib/api";
import { cn, formatDate, statusColor } from "@/lib/utils";
import type { Scan } from "@/types";

const mockScans: Scan[] = [
  { id: "1", scan_type: "discovery", status: "completed", target_network: "192.168.1.0/24", devices_found: 5, open_ports_found: 0, duration_seconds: 12.3, error_message: null, started_at: new Date(Date.now() - 300000).toISOString(), completed_at: new Date(Date.now() - 288000).toISOString() },
  { id: "2", scan_type: "port_scan", status: "completed", target_network: "192.168.1.0/24", devices_found: 4, open_ports_found: 8, duration_seconds: 45.7, error_message: null, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3555000).toISOString() },
  { id: "3", scan_type: "discovery", status: "completed", target_network: "192.168.1.0/24", devices_found: 5, open_ports_found: 0, duration_seconds: 11.8, error_message: null, started_at: new Date(Date.now() - 7200000).toISOString(), completed_at: new Date(Date.now() - 7188000).toISOString() },
  { id: "4", scan_type: "full", status: "failed", target_network: "10.0.0.0/24", devices_found: 0, open_ports_found: 0, duration_seconds: 5.2, error_message: "Network unreachable", started_at: new Date(Date.now() - 86400000).toISOString(), completed_at: new Date(Date.now() - 86395000).toISOString() },
];

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  running: Loader2,
  queued: Clock,
  failed: XCircle,
};

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadScans = async () => {
    try {
      const data = await fetchScans({ limit: 20 });
      setScans(data);
    } catch {
      setScans(mockScans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const handleScan = async (type: string) => {
    setScanning(true);
    try {
      await createScan({ scan_type: type });
      // Reload after a delay to show results
      setTimeout(loadScans, 3000);
    } catch {
      // Ignore errors
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scans</h1>
        <p className="text-sm text-muted-foreground">
          Run and manage network scans
        </p>
      </div>

      {/* Scan Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { type: "discovery", label: "Device Discovery", desc: "ARP scan to find all devices on the network", color: "text-blue-500 bg-blue-500/10" },
          { type: "port_scan", label: "Port Scan", desc: "Scan common ports on all online devices", color: "text-purple-500 bg-purple-500/10" },
          { type: "full", label: "Full Scan", desc: "Complete discovery + port scan + analysis", color: "text-cyan-500 bg-cyan-500/10" },
        ].map((scan) => (
          <button
            key={scan.type}
            onClick={() => handleScan(scan.type)}
            disabled={scanning}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <div className={cn("rounded-lg p-3", scan.color)}>
              {scanning ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{scan.label}</p>
              <p className="text-xs text-muted-foreground">{scan.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Scan History */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Scan History</h3>
        </div>
        <div className="divide-y divide-border/50">
          {scans.map((scan) => {
            const StatusIcon = statusIcons[scan.status] || Clock;
            return (
              <div
                key={scan.id}
                className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("rounded-lg p-2", statusColor(scan.status))}>
                    <StatusIcon className={cn("h-5 w-5", scan.status === "running" && "animate-spin")} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {scan.scan_type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scan.target_network} &bull; {formatDate(scan.started_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-foreground">{scan.devices_found} devices</p>
                    <p className="text-xs text-muted-foreground">
                      {scan.open_ports_found} open ports
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={statusColor(scan.status)}>{scan.status}</p>
                    {scan.duration_seconds && (
                      <p className="text-xs text-muted-foreground">
                        {scan.duration_seconds}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {scans.length === 0 && !loading && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No scans yet. Run your first scan above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
