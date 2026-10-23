"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/lib/websocket";
import { isDemo } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Announces alerts pushed over the WebSocket to screen reader users.
export default function LiveRegion() {
  const { t } = useI18n();
  const { lastMessage } = useWebSocket(isDemo ? null : undefined);
  const [text, setText] = useState("");

  useEffect(() => {
    const data = lastMessage?.data as { title?: string } | undefined;
    if (lastMessage?.type === "alert" && data?.title) setText(t("app.newAlert", { title: data.title }));
  }, [lastMessage, t]);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {text}
    </div>
  );
}
