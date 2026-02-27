"use client";

import { Monitor, Router, Smartphone, Tv, Server, HelpCircle, Shield, ShieldOff } from "lucide-react";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { Device } from "@/types";

interface DeviceTableProps {
  devices: Device[];
  onTrust?: (id: string, trusted: boolean) => void;
}

const typeIcons: Record<string, typeof Monitor> = {
  router: Router,
  desktop: Monitor,
  mobile: Smartphone,
  tv: Tv,
  server: Server,
  unknown: HelpCircle,
};

export default function DeviceTable({ devices, onTrust }: DeviceTableProps) {
  if (devices.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        No devices found. Run a scan to discover devices.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Device</th>
            <th className="px-4 py-3 font-medium">IP Address</th>
            <th className="px-4 py-3 font-medium">MAC Address</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Last Seen</th>
            <th className="px-4 py-3 font-medium">Trust</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const Icon = typeIcons[device.device_type] || HelpCircle;
            return (
              <tr
                key={device.id}
                className="border-b border-border/50 hover:bg-accent/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex h-2.5 w-2.5 rounded-full",
                      device.is_online ? "bg-green-500" : "bg-slate-600"
                    )}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {device.hostname || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {device.ip_address}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {device.mac_address || "N/A"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {device.vendor || "Unknown"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {timeAgo(device.last_seen)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onTrust?.(device.id, !device.is_trusted)}
                    className={cn(
                      "rounded-lg p-1.5 transition-colors",
                      device.is_trusted
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                    title={device.is_trusted ? "Trusted" : "Not trusted"}
                  >
                    {device.is_trusted ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <ShieldOff className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
