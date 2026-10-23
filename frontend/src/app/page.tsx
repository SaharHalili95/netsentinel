"use client";

import Link from "next/link";
import StatsCards from "@/components/dashboard/StatsCards";
import DeviceChart from "@/components/dashboard/DeviceChart";
import AlertsFeed from "@/components/dashboard/AlertsFeed";
import NetworkMap from "@/components/dashboard/NetworkMap";
import TrafficGraph from "@/components/dashboard/TrafficGraph";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import { fetchDashboard, fetchDevices, fetchTrafficSummary } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function DashboardPage() {
  const { t } = useI18n();
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([fetchDashboard(), fetchDevices(), fetchTrafficSummary()])
  );
  const [dashboard, devices, traffic] = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} onRefresh={reload} loading={loading} />

      {error ? <ErrorState onRetry={reload} /> : null}

      {dashboard && devices && traffic && (
        <>
          <StatsCards data={dashboard} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TrafficGraph hourly={traffic.hourly} />
            <DeviceChart types={dashboard.devices.types} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <NetworkMap devices={devices} />
            <section aria-labelledby="recent-alerts" className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="recent-alerts" className="text-sm font-semibold text-foreground">
                  {t("dashboard.recentAlerts")}
                </h2>
                <Link href="/alerts" className="text-xs text-primary hover:underline">
                  {t("dashboard.viewAll")}
                </Link>
              </div>
              <AlertsFeed alerts={dashboard.recent_alerts} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
