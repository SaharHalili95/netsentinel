"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

interface ChartFigureProps {
  title: string;
  description?: string;
  columns: string[];
  rows: (string | number)[][];
  children: React.ReactNode;
}

// A chart with a caption and a screen-reader table of the same numbers.
export default function ChartFigure({ title, description, columns, rows, children }: ChartFigureProps) {
  const { t } = useI18n();
  return (
    <figure className="rounded-xl border border-border bg-card p-5">
      <figcaption className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </figcaption>
      <div aria-hidden="true">{children}</div>
      <table className="sr-only">
        <caption>{`${title}: ${t("common.chartData")}`}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
