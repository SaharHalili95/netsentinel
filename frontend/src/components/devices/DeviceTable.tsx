"use client";

import { Fragment, useState } from "react";
import { ChevronDown, HelpCircle, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device } from "@/types";
import Ltr from "@/components/ui/Ltr";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { deviceIcons } from "./deviceIcons";
import DeviceDetail from "./DeviceDetail";
import ScrollRegion from "@/components/ui/ScrollRegion";

interface DeviceTableProps {
  devices: Device[];
  onTrust: (device: Device) => void;
}

export default function DeviceTable({ devices, onTrust }: DeviceTableProps) {
  const { t, fmt } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (devices.length === 0) {
    return <p className="flex h-48 items-center justify-center p-4 text-center text-muted-foreground">{t("devices.empty")}</p>;
  }

  return (
    <ScrollRegion label={t("devices.tableCaption")}>
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{t("devices.tableCaption")}</caption>
        <thead>
          <tr className="border-b border-border text-start text-xs text-muted-foreground">
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.device")}</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.status")}</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.ip")}</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.mac")}</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.lastSeen")}</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">{t("devices.trust")}</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const Icon = deviceIcons[device.device_type] ?? HelpCircle;
            const name = device.hostname ?? device.ip_address;
            const isOpen = expanded === device.id;
            return (
              <Fragment key={device.id}>
                <tr className="border-b border-border/50 transition-colors hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`device-${device.id}`}
                      onClick={() => setExpanded(isOpen ? null : device.id)}
                      className="flex items-center gap-2 rounded text-start font-medium text-foreground"
                    >
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{device.hostname ?? t("common.unknown")}</span>
                      <span className="sr-only">, {t(`enum.deviceType.${device.device_type}`)}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("h-2.5 w-2.5 rounded-full", device.is_online ? "bg-green-500" : "bg-slate-500")} aria-hidden="true" />
                      {device.is_online ? t("devices.onlineStatus") : t("devices.offlineStatus")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground"><Ltr>{device.ip_address}</Ltr></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground"><Ltr>{device.mac_address ?? t("common.na")}</Ltr></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmt.ago(device.last_seen)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onTrust(device)}
                      aria-pressed={device.is_trusted}
                      aria-label={t(device.is_trusted ? "devices.markUntrusted" : "devices.markTrusted", { name })}
                      title={device.is_trusted ? t("devices.trusted") : t("devices.notTrusted")}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        device.is_trusted ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {device.is_trusted ? <Shield className="h-4 w-4" aria-hidden="true" /> : <ShieldOff className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr id={`device-${device.id}`} className="border-b border-border/50 bg-accent/10">
                    <td colSpan={6} className="px-4 py-4">
                      <DeviceDetail device={device} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </ScrollRegion>
  );
}
