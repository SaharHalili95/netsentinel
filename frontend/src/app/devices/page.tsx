"use client";

import { useEffect, useState } from "react";
import { Monitor, RefreshCw } from "lucide-react";
import DeviceTable from "@/components/devices/DeviceTable";
import { fetchDevices, updateDevice } from "@/lib/api";
import type { Device } from "@/types";

const mockDevices: Device[] = [
  { id: "1", ip_address: "192.168.1.1", mac_address: "AA:BB:CC:DD:EE:01", hostname: "router.local", vendor: "TP-Link", device_type: "router", os_info: null, is_online: true, is_trusted: true, notes: null, first_seen: new Date(Date.now() - 86400000 * 30).toISOString(), last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "2", ip_address: "192.168.1.100", mac_address: "AA:BB:CC:DD:EE:02", hostname: "desktop-pc", vendor: "Dell", device_type: "desktop", os_info: "Windows 11", is_online: true, is_trusted: true, notes: null, first_seen: new Date(Date.now() - 86400000 * 20).toISOString(), last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "3", ip_address: "192.168.1.101", mac_address: "AA:BB:CC:DD:EE:03", hostname: "iphone-sahar", vendor: "Apple", device_type: "mobile", os_info: "iOS 18", is_online: true, is_trusted: true, notes: null, first_seen: new Date(Date.now() - 86400000 * 15).toISOString(), last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "4", ip_address: "192.168.1.102", mac_address: "AA:BB:CC:DD:EE:04", hostname: "smart-tv", vendor: "Samsung", device_type: "tv", os_info: null, is_online: true, is_trusted: false, notes: null, first_seen: new Date(Date.now() - 86400000 * 10).toISOString(), last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "5", ip_address: "192.168.1.150", mac_address: "AA:BB:CC:DD:EE:05", hostname: null, vendor: "Unknown", device_type: "unknown", os_info: null, is_online: true, is_trusted: false, notes: null, first_seen: new Date(Date.now() - 3600000).toISOString(), last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "6", ip_address: "192.168.1.103", mac_address: "AA:BB:CC:DD:EE:06", hostname: "old-laptop", vendor: "Lenovo", device_type: "desktop", os_info: null, is_online: false, is_trusted: true, notes: null, first_seen: new Date(Date.now() - 86400000 * 60).toISOString(), last_seen: new Date(Date.now() - 86400000 * 3).toISOString(), created_at: new Date().toISOString() },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await fetchDevices(filter === "online" ? { online_only: true } : undefined);
      setDevices(data);
    } catch {
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [filter]);

  const handleTrust = async (id: string, trusted: boolean) => {
    try {
      await updateDevice(id, { is_trusted: trusted } as Partial<Device>);
    } catch {
      // Update locally as fallback
    }
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_trusted: trusted } : d))
    );
  };

  const filteredDevices = devices.filter((d) => {
    if (filter === "online") return d.is_online;
    if (filter === "offline") return !d.is_online;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Devices</h1>
          <p className="text-sm text-muted-foreground">
            {devices.length} devices discovered on your network
          </p>
        </div>
        <button
          onClick={loadDevices}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "online", "offline"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? `All (${devices.length})` : f === "online" ? `Online (${devices.filter(d => d.is_online).length})` : `Offline (${devices.filter(d => !d.is_online).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <DeviceTable devices={filteredDevices} onTrust={handleTrust} />
      </div>
    </div>
  );
}
