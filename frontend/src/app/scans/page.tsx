"use client";

import { useState } from "react";
import { Play, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import Ltr from "@/components/ui/Ltr";
import { fetchScans, createScan } from "@/lib/api";
import { cn, statusColor } from "@/lib/utils";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  running: Loader2,
  queued: Clock,
  failed: XCircle,
};

const SCAN_TYPES = [
  { type: "discovery", desc: "scans.discoveryDesc", color: "text-blue-400 bg-blue-500/10" },
  { type: "port_scan", desc: "scans.portScanDesc", color: "text-purple-400 bg-purple-500/10" },
  { type: "full", desc: "scans.fullDesc", color: "text-cyan-400 bg-cyan-500/10" },
];

export default function ScansPage() {
  const { t, fmt } = useI18n();
  const { data: scans, error, loading, reload } = useAsync(() => fetchScans({ limit: 20 }));
  const [running, setRunning] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const handleScan = async (type: string) => {
    setRunning(type);
    setActionError(false);
    setAnnouncement(t("scans.running"));
    try {
      const scan = await createScan({ scan_type: type });
      await reload();
      if (scan.status === "completed") {
        setAnnouncement(
          t("scans.started", { name: t(`enum.scanType.${type}`), devices: scan.devices_found, ports: scan.open_ports_found })
        );
      }
    } catch {
      setActionError(true);
      setAnnouncement("");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("scans.title")} subtitle={t("scans.subtitle")} onRefresh={reload} loading={loading} />

      <p role="status" className="sr-only">{announcement}</p>
      {actionError && <ErrorState message={t("common.actionError")} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SCAN_TYPES.map((scan) => {
          const name = t(`enum.scanType.${scan.type}`);
          return (
            <button
              key={scan.type}
              type="button"
              onClick={() => handleScan(scan.type)}
              disabled={running !== null}
              aria-label={t("scans.run", { name })}
              aria-describedby={`desc-${scan.type}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-start transition-colors hover:bg-accent/50 disabled:opacity-60"
            >
              <span className={cn("rounded-lg p-3", scan.color)}>
                {running === scan.type ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <Play className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true" />}
              </span>
              <span>
                <span className="block font-semibold text-foreground">{name}</span>
                <span id={`desc-${scan.type}`} className="block text-xs text-muted-foreground">{t(scan.desc)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {error ? <ErrorState onRetry={reload} /> : null}

      {scans && (
        <section aria-labelledby="scan-history" className="rounded-xl border border-border bg-card">
          <h2 id="scan-history" className="border-b border-border p-4 text-sm font-semibold text-foreground">
            {t("scans.history")}
          </h2>
          {scans.length === 0 ? (
            <p className="flex h-32 items-center justify-center text-muted-foreground">{t("scans.empty")}</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {scans.map((scan) => {
                const StatusIcon = statusIcons[scan.status] ?? Clock;
                return (
                  <li key={scan.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-4">
                      <StatusIcon className={cn("h-5 w-5", statusColor(scan.status), scan.status === "running" && "animate-spin")} aria-hidden="true" />
                      <div>
                        <p className="font-medium text-foreground">{t(`enum.scanType.${scan.scan_type}`)}</p>
                        <p className="text-xs text-muted-foreground">
                          <Ltr>{scan.target_network}</Ltr> · {fmt.date(scan.started_at)}
                        </p>
                        {scan.error_message && <p className="text-xs text-red-400" dir="auto">{scan.error_message}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-end">
                        <p className="text-foreground">{t("scans.devices", { n: scan.devices_found })}</p>
                        <p className="text-xs text-muted-foreground">{t("scans.ports", { n: scan.open_ports_found })}</p>
                      </div>
                      <div className="text-end">
                        <p className={statusColor(scan.status)}>{t(`enum.scanStatus.${scan.status}`)}</p>
                        {scan.duration_seconds != null && (
                          <p className="text-xs text-muted-foreground">{t("scans.seconds", { n: fmt.number(scan.duration_seconds) })}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
