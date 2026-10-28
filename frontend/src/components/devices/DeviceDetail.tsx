"use client";

import { Globe, Lock, Server } from "lucide-react";
import type { Device } from "@/types";
import Ltr from "@/components/ui/Ltr";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function DeviceDetail({ device }: { device: Device }) {
  const { t, fmt } = useI18n();
  const ports = Object.entries(device.open_ports ?? {});

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{t("devices.vendor")}</dt>
          <dd className="text-foreground">{device.vendor ?? t("common.unknown")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">OS</dt>
          <dd className="text-foreground">{device.os_info ?? t("common.unknown")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("devices.lastSeen")}</dt>
          <dd className="text-foreground">{fmt.date(device.last_seen)}</dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t("devices.openPorts")}</h3>
        {ports.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("common.none")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ports.map(([port, info]) => {
              const Icon = info.service.startsWith("http") ? Globe : info.service === "ssh" ? Lock : Server;
              return (
                <li key={port} className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 p-3">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <Ltr>{`${port}/${info.protocol}`}</Ltr> <span className="text-muted-foreground">{info.service}</span>
                    </p>
                    {info.product && (
                      <p className="truncate text-xs text-muted-foreground">
                        {info.product} {info.version ?? ""}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
