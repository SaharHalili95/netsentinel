"use client";

import { Info } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";

const STEPS = ["discovery", "ports", "capture", "anomaly", "alerts", "ui"];

const STACK = [
  { name: "FastAPI", reason: "fastapi" },
  { name: "PostgreSQL", reason: "postgres" },
  { name: "Redis", reason: "redis" },
  { name: "APScheduler", reason: "scheduler" },
  { name: "WebSocket", reason: "websocket" },
  { name: "Scapy", reason: "scapy" },
  { name: "nmap", reason: "nmap" },
  { name: "GeoIP2", reason: "geoip" },
  { name: "Next.js", reason: "nextjs" },
];

export default function HowItWorksPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("howItWorks.title")} subtitle={t("howItWorks.subtitle")} />

      <section aria-labelledby="pipeline" className="rounded-xl border border-border bg-card p-5">
        <h2 id="pipeline" className="text-sm font-semibold text-foreground">{t("howItWorks.pipeline")}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t("howItWorks.pipelineDesc")}</p>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step} className="relative flex gap-3 rounded-lg border border-border bg-accent/20 p-4">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t(`howItWorks.steps.${step}`)}</h3>
                <p className="text-xs text-muted-foreground">{t(`howItWorks.steps.${step}Desc`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="stack" className="rounded-xl border border-border bg-card">
        <h2 id="stack" className="border-b border-border p-4 text-sm font-semibold text-foreground">{t("howItWorks.stack")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("howItWorks.stack")}</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 text-start">{t("howItWorks.tech")}</th>
                <th scope="col" className="px-4 py-2 text-start">{t("howItWorks.why")}</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map((item) => (
                <tr key={item.name} className="border-b border-border/50 align-top">
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-start font-medium text-foreground">
                    {item.name}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{t(`howItWorks.reasons.${item.reason}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="demo-note" className="flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" aria-hidden="true" />
        <div>
          <h2 id="demo-note" className="text-sm font-semibold text-yellow-300">{t("howItWorks.demoTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("howItWorks.demoBody")}</p>
        </div>
      </section>
    </div>
  );
}
