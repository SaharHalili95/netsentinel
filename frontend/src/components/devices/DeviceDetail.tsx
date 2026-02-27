"use client";

import { Globe, Lock, Server } from "lucide-react";
import type { Device } from "@/types";
import { formatDate } from "@/lib/utils";

interface DeviceDetailProps {
  device: Device;
}

export default function DeviceDetail({ device }: DeviceDetailProps) {
  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">IP Address</span>
          <p className="font-mono text-foreground">{device.ip_address}</p>
        </div>
        <div>
          <span className="text-muted-foreground">MAC Address</span>
          <p className="font-mono text-foreground">{device.mac_address || "N/A"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Vendor</span>
          <p className="text-foreground">{device.vendor || "Unknown"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">First Seen</span>
          <p className="text-foreground">{formatDate(device.first_seen)}</p>
        </div>
      </div>

      {/* Open Ports */}
      {device.open_ports && Object.keys(device.open_ports).length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Open Ports</h4>
          <div className="space-y-2">
            {Object.entries(device.open_ports).map(([port, info]) => (
              <div
                key={port}
                className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3"
              >
                <div className="rounded bg-primary/10 p-1.5">
                  {info.service === "http" || info.service === "https" ? (
                    <Globe className="h-4 w-4 text-primary" />
                  ) : info.service === "ssh" ? (
                    <Lock className="h-4 w-4 text-green-500" />
                  ) : (
                    <Server className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {port}/{info.protocol}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {info.service}
                    </span>
                  </div>
                  {info.product && (
                    <p className="text-xs text-muted-foreground">
                      {info.product} {info.version || ""}
                    </p>
                  )}
                </div>
                <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
                  {info.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
