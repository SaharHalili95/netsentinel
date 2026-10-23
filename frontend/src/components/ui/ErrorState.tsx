"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message ?? t("common.loadError")}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-1.5 font-medium hover:bg-red-500/20"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
