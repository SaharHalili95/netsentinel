"use client";

import { useState } from "react";
import DeviceTable from "@/components/devices/DeviceTable";
import PageHeader from "@/components/ui/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import FilterButtons from "@/components/ui/FilterButtons";
import { fetchDevices, updateDevice } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Device } from "@/types";

type Filter = "all" | "online" | "offline";

export default function DevicesPage() {
  const { t } = useI18n();
  const { data: devices, error, loading, reload, setData } = useAsync(() => fetchDevices());
  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState(false);

  const handleTrust = async (device: Device) => {
    setActionError(false);
    try {
      const updated = await updateDevice(device.id, { is_trusted: !device.is_trusted });
      setData((prev) => prev?.map((d) => (d.id === device.id ? { ...d, is_trusted: updated.is_trusted } : d)) ?? prev);
    } catch {
      setActionError(true);
    }
  };

  const list = devices ?? [];
  const online = list.filter((d) => d.is_online).length;
  const shown = list.filter((d) => (filter === "online" ? d.is_online : filter === "offline" ? !d.is_online : true));

  return (
    <div className="space-y-6">
      <PageHeader title={t("devices.title")} subtitle={t("devices.subtitle", { n: list.length })} onRefresh={reload} loading={loading} />

      {error ? <ErrorState onRetry={reload} /> : null}
      {actionError && <ErrorState message={t("common.actionError")} />}

      {devices && (
        <>
          <FilterButtons
            label={t("devices.title")}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t("devices.filterAll", { n: list.length }) },
              { value: "online", label: t("devices.filterOnline", { n: online }) },
              { value: "offline", label: t("devices.filterOffline", { n: list.length - online }) },
            ]}
          />
          <div className="rounded-xl border border-border bg-card">
            <DeviceTable devices={shown} onTrust={handleTrust} />
          </div>
        </>
      )}
    </div>
  );
}
