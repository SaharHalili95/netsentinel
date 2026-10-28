"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, CircleDashed, XCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import ChartFigure from "@/components/ui/ChartFigure";
import { axisColor, gridColor, tooltipStyle } from "@/components/dashboard/chartTheme";
import { fetchComplianceHistory, fetchComplianceStatus, fetchCriteria, fetchRequiredChecks } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import ScrollRegion from "@/components/ui/ScrollRegion";

const STATUS_STYLE = {
  pass: { icon: CheckCircle, color: "text-green-400" },
  fail: { icon: XCircle, color: "text-red-400" },
  na: { icon: CircleDashed, color: "text-muted-foreground" },
  missing: { icon: CircleDashed, color: "text-yellow-400" },
};

export default function CompliancePage() {
  const { t, fmt, locale } = useI18n();
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([fetchComplianceStatus(), fetchRequiredChecks(), fetchComplianceHistory(30), fetchCriteria()])
  );
  const [status, required, history, criteria] = data ?? [];
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "he" ? "he-IL" : "en-IL", { day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <PageHeader title={t("compliance.title")} subtitle={t("compliance.subtitle")} onRefresh={reload} loading={loading} />
      {error ? <ErrorState onRetry={reload} /> : null}

      {status && required && history && criteria && (
        <>
          <section aria-labelledby="score" className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 id="score" className="text-sm text-muted-foreground">{t("compliance.score")}</h2>
              <p className="text-4xl font-bold text-foreground">{fmt.number(status.score_pct)}%</p>
            </div>
            <ul className="flex flex-wrap gap-4 text-sm">
              <li className="text-green-400">{t("compliance.passed", { n: status.passed })}</li>
              <li className="text-red-400">{t("compliance.failed", { n: status.failed })}</li>
              <li className="text-yellow-400">{t("compliance.missing", { n: status.missing })}</li>
            </ul>
          </section>

          <section aria-labelledby="checks" className="rounded-xl border border-border bg-card">
            <h2 id="checks" className="border-b border-border p-4 text-sm font-semibold text-foreground">{t("compliance.checks")}</h2>
            <ScrollRegion label={t("compliance.checks")}>
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">{t("compliance.checks")}</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-start">{t("compliance.check")}</th>
                    <th scope="col" className="px-4 py-2 text-start">{t("compliance.criteria")}</th>
                    <th scope="col" className="px-4 py-2 text-start">{t("compliance.status")}</th>
                    <th scope="col" className="px-4 py-2 text-start">{t("compliance.notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {required.map((req) => {
                    const done = status.checks.find((c) => c.check_type === req.check_type);
                    const state = done?.status ?? "missing";
                    const { icon: Icon, color } = STATUS_STYLE[state];
                    return (
                      <tr key={req.check_type} className="border-b border-border/50">
                        <td className="px-4 py-3 text-foreground">{t(`enum.checkType.${req.check_type}`)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{req.criteria}</td>
                        <td className="px-4 py-3">
                          <span className={cn("flex items-center gap-1.5", color)}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {t(`enum.checkStatus.${state}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground" dir="auto">{done?.notes ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollRegion>
          </section>

          <ChartFigure
            title={t("compliance.history")}
            description={t("compliance.historyDesc")}
            columns={[t("compliance.date"), t("compliance.scoreCol")]}
            rows={history.map((d) => [shortDate(d.date), `${d.score_pct}%`])}
          >
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[...history].reverse().map((d) => ({ ...d, label: shortDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" stroke={axisColor} fontSize={10} minTickGap={24} />
                  <YAxis domain={[0, 100]} stroke={axisColor} fontSize={10} unit="%" width={44} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score_pct" name={t("compliance.scoreCol")} stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartFigure>

          <section aria-labelledby="criteria" className="rounded-xl border border-border bg-card p-5">
            <h2 id="criteria" className="mb-3 text-sm font-semibold text-foreground">{t("compliance.criteriaTitle")}</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {Object.keys(criteria).map((code) => (
                <div key={code}>
                  <dt className="font-mono text-xs text-primary">{code}</dt>
                  <dd className="text-muted-foreground">{t(`enum.criteria.${code}`)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
