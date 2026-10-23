"use client";

import { CheckCircle, Info } from "lucide-react";
import { cn, severityColor } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { severityIcons } from "@/components/alerts/severityIcons";
import type { DashboardData } from "@/types";

export default function AlertsFeed({ alerts }: { alerts: DashboardData["recent_alerts"] }) {
  const { t, fmt } = useI18n();

  if (alerts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <CheckCircle className="h-8 w-8 text-green-400" aria-hidden="true" />
        <p className="text-sm">{t("dashboard.allClear")}</p>
      </div>
    );
  }

  return (
    <ul className="max-h-[340px] space-y-2 overflow-y-auto pe-1">
      {alerts.map((alert) => {
        const Icon = severityIcons[alert.severity] ?? Info;
        return (
          <li key={alert.id} className={cn("flex items-start gap-3 rounded-lg border p-3", severityColor(alert.severity))}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground" dir="auto">{alert.title}</p>
              <p className="text-xs text-muted-foreground">
                {fmt.ago(alert.created_at)} · {t(`enum.alertStatus.${alert.status}`)}
              </p>
            </div>
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              {t(`enum.severity.${alert.severity}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
