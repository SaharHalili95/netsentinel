"use client";

import { Bell, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";

export default function Header() {
  const { isConnected } = useWebSocket();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Network Security Monitor
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-500">Offline</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
