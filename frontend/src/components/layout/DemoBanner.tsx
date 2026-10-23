"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function DemoBanner() {
  const { t } = useI18n();
  return (
    <div className="relative z-[55] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-yellow-400 px-4 py-1.5 text-center text-xs font-medium text-black lg:ps-64">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{t("app.demoBanner")}</span>
      <Link href="/how-it-works" className="underline underline-offset-2">
        {t("app.demoLink")}
      </Link>
    </div>
  );
}
