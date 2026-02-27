"use client";

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn, severityColor, timeAgo } from "@/lib/utils";

interface AlertItem {
  id: string;
  severity: string;
  title: string;
  status: string;
  created_at: string;
}

interface AlertsFeedProps {
  alerts: AlertItem[];
}

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
};

export default function AlertsFeed({ alerts }: AlertsFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="text-sm">All clear! No recent alerts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
      {alerts.map((alert) => {
        const Icon = severityIcons[alert.severity] || Info;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              severityColor(alert.severity)
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {alert.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(alert.created_at)}
              </p>
            </div>
            <span
              className={cn(
                "flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                severityColor(alert.severity)
              )}
            >
              {alert.severity}
            </span>
          </div>
        );
      })}
    </div>
  );
}
