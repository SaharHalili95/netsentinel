"use client";

import { useState } from "react";
import { CheckCircle, Eye, Info, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import FilterButtons from "@/components/ui/FilterButtons";
import Ltr from "@/components/ui/Ltr";
import { severityIcons } from "@/components/alerts/severityIcons";
import { fetchAlerts, updateAlert, resolveAllAlerts } from "@/lib/api";
import { cn, severityColor, statusColor } from "@/lib/utils";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Alert } from "@/types";

type Filter = "all" | "active" | Alert["severity"];

export default function AlertsPage() {
  const { t, fmt } = useI18n();
  const { data: alerts, error, loading, reload, setData } = useAsync(() => fetchAlerts({ limit: 50 }));
  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const handleStatusChange = async (alert: Alert, status: Alert["status"]) => {
    setActionError(false);
    try {
      const updated = await updateAlert(alert.id, { status });
      setData((prev) => prev?.map((a) => (a.id === alert.id ? { ...a, status: updated.status } : a)) ?? prev);
      setAnnouncement(`${alert.title}: ${t(`enum.alertStatus.${updated.status}`)}`);
    } catch {
      setActionError(true);
    }
  };

  const handleResolveAll = async () => {
    setActionError(false);
    try {
      await resolveAllAlerts();
      setData((prev) => prev?.map((a) => ({ ...a, status: "resolved" as const })) ?? prev);
      setAnnouncement(t("alerts.resolvedAll"));
    } catch {
      setActionError(true);
    }
  };

  const list = alerts ?? [];
  const shown = list.filter((a) => (filter === "all" ? true : filter === "active" ? a.status !== "resolved" : a.severity === filter));
  const openCount = list.filter((a) => a.status === "open").length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("alerts.title")} subtitle={t("alerts.openCount", { n: openCount })} onRefresh={reload} loading={loading}>
        {openCount > 0 && (
          <button
            type="button"
            onClick={handleResolveAll}
            className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("alerts.resolveAll")}
          </button>
        )}
      </PageHeader>

      <p role="status" className="sr-only">{announcement}</p>
      {error ? <ErrorState onRetry={reload} /> : null}
      {actionError && <ErrorState message={t("common.actionError")} />}

      {alerts && (
        <>
          <FilterButtons
            label={t("alerts.filters")}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t("alerts.filterAll") },
              { value: "active", label: t("alerts.filterActive") },
              ...(["critical", "high", "medium", "low"] as const).map((s) => ({ value: s, label: t(`enum.severity.${s}`) })),
            ]}
          />

          {shown.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-border text-muted-foreground">
              <CheckCircle className="h-8 w-8 text-green-400" aria-hidden="true" />
              {t("alerts.empty")}
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((alert) => {
                const Icon = severityIcons[alert.severity] ?? Info;
                return (
                  <li
                    key={alert.id}
                    className={cn("rounded-xl border p-4", severityColor(alert.severity), alert.status === "resolved" && "border-border bg-card text-muted-foreground")}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-medium text-foreground" dir="auto">{alert.title}</h2>
                          <span className="rounded border border-current px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                            {t(`enum.severity.${alert.severity}`)}
                          </span>
                          <span className={cn("text-xs", statusColor(alert.status))}>{t(`enum.alertStatus.${alert.status}`)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground" dir="auto">{alert.description}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{fmt.ago(alert.created_at)}</span>
                          {alert.source_ip && <span>{t("alerts.source", { ip: "" })}<Ltr>{alert.source_ip}</Ltr></span>}
                          <span>{t(`enum.alertType.${alert.alert_type}`)}</span>
                        </p>
                      </div>
                      {alert.status !== "resolved" && (
                        <div className="flex shrink-0 gap-1">
                          {alert.status === "open" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(alert, "acknowledged")}
                              aria-label={t("alerts.acknowledge", { title: alert.title })}
                              title={t("enum.alertStatus.acknowledged")}
                              className="rounded-lg p-2 text-yellow-400 transition-colors hover:bg-yellow-500/10"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(alert, "resolved")}
                            aria-label={t("alerts.resolve", { title: alert.title })}
                            title={t("enum.alertStatus.resolved")}
                            className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-500/10"
                          >
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
