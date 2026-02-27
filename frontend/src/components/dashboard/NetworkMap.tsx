"use client";

import { Monitor, Router, Smartphone, Tv, HelpCircle, Server } from "lucide-react";

interface NetworkDevice {
  ip: string;
  hostname: string;
  type: string;
  isOnline: boolean;
}

const typeIcons: Record<string, typeof Monitor> = {
  router: Router,
  desktop: Monitor,
  mobile: Smartphone,
  tv: Tv,
  server: Server,
  unknown: HelpCircle,
};

// Mock devices for visualization
const mockDevices: NetworkDevice[] = [
  { ip: "192.168.1.1", hostname: "Router", type: "router", isOnline: true },
  { ip: "192.168.1.100", hostname: "Desktop PC", type: "desktop", isOnline: true },
  { ip: "192.168.1.101", hostname: "iPhone", type: "mobile", isOnline: true },
  { ip: "192.168.1.102", hostname: "Smart TV", type: "tv", isOnline: true },
  { ip: "192.168.1.150", hostname: "Unknown", type: "unknown", isOnline: true },
  { ip: "192.168.1.103", hostname: "Server", type: "server", isOnline: false },
];

export default function NetworkMap() {
  return (
    <div className="relative flex h-[260px] items-center justify-center">
      {/* Center - Router */}
      <div className="absolute flex flex-col items-center gap-1">
        <div className="rounded-full bg-primary/20 p-4 ring-2 ring-primary/40">
          <Router className="h-8 w-8 text-primary" />
        </div>
        <span className="text-[10px] text-muted-foreground">Gateway</span>
      </div>

      {/* Surrounding devices */}
      {mockDevices.slice(1).map((device, index) => {
        const angle = (index * 360) / (mockDevices.length - 1);
        const radius = 100;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        const Icon = typeIcons[device.type] || HelpCircle;

        return (
          <div
            key={device.ip}
            className="absolute flex flex-col items-center gap-1"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {/* Connection line */}
            <svg
              className="absolute inset-0 -z-10"
              style={{
                width: "1px",
                height: "1px",
                overflow: "visible",
              }}
            >
              <line
                x1="0"
                y1="0"
                x2={-x}
                y2={-y}
                stroke={device.isOnline ? "hsl(210, 100%, 52%)" : "hsl(216, 34%, 17%)"}
                strokeWidth="1"
                strokeDasharray={device.isOnline ? "none" : "4 4"}
                opacity="0.3"
              />
            </svg>
            <div
              className={`rounded-full p-2.5 ${
                device.isOnline
                  ? "bg-accent ring-1 ring-border"
                  : "bg-muted/50 ring-1 ring-border/50 opacity-40"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  device.isOnline ? "text-foreground" : "text-muted-foreground"
                }`}
              />
            </div>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
              {device.hostname}
            </span>
          </div>
        );
      })}
    </div>
  );
}
