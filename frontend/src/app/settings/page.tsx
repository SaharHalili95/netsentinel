"use client";

import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    scanNetwork: "192.168.1.0/24",
    discoveryInterval: 5,
    portScanInterval: 60,
    trafficCapture: true,
    alertOnNewDevice: true,
    alertOnSuspiciousPort: true,
    alertOnWatchlistCountry: true,
    alertOnTrafficSpike: true,
    notifyEmail: "",
    darkMode: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure scanning, alerts, and notification preferences
        </p>
      </div>

      {/* Network Scanning */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Network Scanning</h3>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Target Network (CIDR)</label>
          <input
            type="text"
            value={settings.scanNetwork}
            onChange={(e) => setSettings({ ...settings, scanNetwork: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Discovery Interval (min)</label>
            <input
              type="number"
              value={settings.discoveryInterval}
              onChange={(e) => setSettings({ ...settings, discoveryInterval: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Port Scan Interval (min)</label>
            <input
              type="number"
              value={settings.portScanInterval}
              onChange={(e) => setSettings({ ...settings, portScanInterval: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.trafficCapture}
            onChange={(e) => setSettings({ ...settings, trafficCapture: e.target.checked })}
            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Enable traffic capture</span>
        </label>
      </div>

      {/* Alert Settings */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Alert Rules</h3>

        {[
          { key: "alertOnNewDevice" as const, label: "Alert on new device discovery" },
          { key: "alertOnSuspiciousPort" as const, label: "Alert on suspicious port detection" },
          { key: "alertOnWatchlistCountry" as const, label: "Alert on watchlist country connections" },
          { key: "alertOnTrafficSpike" as const, label: "Alert on traffic volume spikes" },
        ].map((rule) => (
          <label key={rule.key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings[rule.key]}
              onChange={(e) => setSettings({ ...settings, [rule.key]: e.target.checked })}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">{rule.label}</span>
          </label>
        ))}
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Email for alerts (optional)</label>
          <input
            type="email"
            value={settings.notifyEmail}
            onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </button>
        <button
          onClick={() => setSettings({
            scanNetwork: "192.168.1.0/24",
            discoveryInterval: 5,
            portScanInterval: 60,
            trafficCapture: true,
            alertOnNewDevice: true,
            alertOnSuspiciousPort: true,
            alertOnWatchlistCountry: true,
            alertOnTrafficSpike: true,
            notifyEmail: "",
            darkMode: true,
          })}
          className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </button>
      </div>
    </div>
  );
}
