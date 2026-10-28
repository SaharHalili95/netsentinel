"use client";

import { RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, onRefresh, loading, children }: PageHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-busy={loading}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            {loading ? t("common.refreshing") : t("common.refresh")}
          </button>
        )}
      </div>
    </div>
  );
}
