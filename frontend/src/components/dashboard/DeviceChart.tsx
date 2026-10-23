"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ChartFigure from "@/components/ui/ChartFigure";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { COLORS, tooltipStyle } from "./chartTheme";

export default function DeviceChart({ types }: { types: Record<string, number> }) {
  const { t } = useI18n();
  const data = Object.entries(types).map(([type, value]) => ({
    name: t(`enum.deviceType.${type || "unknown"}`),
    value,
  }));

  if (data.length === 0) {
    return (
      <section className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        {t("dashboard.noDevices")}
      </section>
    );
  }

  return (
    <ChartFigure
      title={t("dashboard.deviceTypes")}
      columns={[t("devices.device"), t("dashboard.count")]}
      rows={data.map((d) => [d.name, d.value])}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-1">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">
                {d.name}: {d.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFigure>
  );
}
