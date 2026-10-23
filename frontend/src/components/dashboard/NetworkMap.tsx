"use client";

import { HelpCircle, Router } from "lucide-react";
import type { Device } from "@/types";
import { deviceIcons } from "@/components/devices/deviceIcons";
import { useI18n } from "@/lib/i18n/I18nProvider";

const RADIUS = 100;

export default function NetworkMap({ devices }: { devices: Device[] }) {
  const { t } = useI18n();
  const gateway = devices.find((d) => d.device_type === "router");
  const others = devices.filter((d) => d !== gateway);
  const label = (d: Device) => d.hostname ?? d.ip_address;
  const status = (d: Device) => (d.is_online ? t("devices.onlineStatus") : t("devices.offlineStatus"));

  return (
    <section aria-labelledby="network-map" className="rounded-xl border border-border bg-card p-5">
      <h2 id="network-map" className="text-sm font-semibold text-foreground">{t("dashboard.topology")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("dashboard.topologyDesc")}</p>

      <ul className="sr-only">
        {gateway && <li>{`${t("dashboard.gateway")}: ${label(gateway)} (${gateway.ip_address})`}</li>}
        {others.map((d) => (
          <li key={d.id}>{`${label(d)} (${d.ip_address}), ${t(`enum.deviceType.${d.device_type}`)}, ${status(d)}`}</li>
        ))}
      </ul>

      <div aria-hidden="true" inert dir="ltr" className="relative flex h-[260px] items-center justify-center overflow-hidden">
        <svg className="absolute inset-0 h-full w-full" viewBox="-130 -130 260 260" preserveAspectRatio="xMidYMid meet">
          {others.map((d, i) => {
            const angle = (i * 2 * Math.PI) / others.length - Math.PI / 2;
            return (
              <line
                key={d.id}
                x1="0"
                y1="0"
                x2={Math.cos(angle) * RADIUS}
                y2={Math.sin(angle) * RADIUS}
                stroke={d.is_online ? "hsl(210, 100%, 60%)" : "hsl(215, 20%, 40%)"}
                strokeWidth="1"
                strokeDasharray={d.is_online ? undefined : "4 4"}
                opacity="0.5"
              />
            );
          })}
        </svg>

        <div className="absolute flex flex-col items-center gap-1">
          <div className="rounded-full bg-primary/20 p-4 ring-2 ring-primary/40">
            <Router className="h-8 w-8 text-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground">{gateway ? label(gateway) : t("dashboard.gateway")}</span>
        </div>

        {others.map((d, i) => {
          const angle = (i * 2 * Math.PI) / others.length - Math.PI / 2;
          const Icon = deviceIcons[d.device_type] ?? HelpCircle;
          return (
            <div
              key={d.id}
              className="absolute flex flex-col items-center gap-1"
              style={{ transform: `translate(${Math.cos(angle) * RADIUS}px, ${Math.sin(angle) * RADIUS}px)` }}
            >
              <div className={`rounded-full p-2.5 ring-1 ${d.is_online ? "bg-accent ring-border" : "bg-muted/50 opacity-50 ring-border/50"}`}>
                <Icon className={`h-4 w-4 ${d.is_online ? "text-foreground" : "text-muted-foreground"}`} />
              </div>
              <span className="max-w-20 truncate text-[10px] text-muted-foreground">{label(d)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
