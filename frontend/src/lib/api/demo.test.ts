import { beforeEach, describe, expect, it } from "vitest";
import * as api from "./demo";

beforeEach(() => api.resetDemo());

describe("demo API", () => {
  it("dashboard counts match devices and open alerts", async () => {
    const [dashboard, devices, alerts] = await Promise.all([
      api.fetchDashboard(),
      api.fetchDevices(),
      api.fetchAlerts(),
    ]);
    const open = alerts.filter((a) => a.status === "open");

    expect(dashboard.devices.total).toBe(devices.length);
    expect(dashboard.devices.online).toBe(devices.filter((d) => d.is_online).length);
    expect(dashboard.alerts.total).toBe(open.length);
    expect(dashboard.alerts.critical).toBe(open.filter((a) => a.severity === "critical").length);
  });

  it("updateAlert persists across fetchAlerts", async () => {
    const [first] = await api.fetchAlerts();
    await api.updateAlert(first.id, { status: "acknowledged" });

    const again = await api.fetchAlerts();
    expect(again.find((a) => a.id === first.id)?.status).toBe("acknowledged");
  });

  it("resolveAllAlerts leaves zero open", async () => {
    await api.resolveAllAlerts();

    expect((await api.fetchAlertCounts()).total).toBe(0);
    expect((await api.fetchAlerts()).every((a) => a.status === "resolved")).toBe(true);
  });

  it("updateDevice trust persists", async () => {
    const device = (await api.fetchDevices()).find((d) => !d.is_trusted)!;
    await api.updateDevice(device.id, { is_trusted: true });

    expect((await api.fetchDevice(device.id)).is_trusted).toBe(true);
  });

  it("online_only filters devices", async () => {
    const online = await api.fetchDevices({ online_only: true });
    expect(online.length).toBeGreaterThan(0);
    expect(online.every((d) => d.is_online)).toBe(true);
  });

  it("createScan prepends a completed scan", async () => {
    const before = await api.fetchScans();
    const scan = await api.createScan({ scan_type: "port_scan" });

    const after = await api.fetchScans();
    expect(after).toHaveLength(before.length + 1);
    expect(after[0].id).toBe(scan.id);
    expect(scan.status).toBe("completed");
  });

  it("traffic summary has 24 hourly buckets", async () => {
    const summary = await api.fetchTrafficSummary();

    expect(summary.hourly).toHaveLength(24);
    expect(summary.suspicious.length).toBeGreaterThan(0);
    expect(summary.total_bytes).toBe(
      summary.hourly.reduce((sum, h) => sum + h.inbound_bytes + h.outbound_bytes, 0)
    );
  });

  it("compliance status score matches passed/required", async () => {
    const [status, required] = await Promise.all([api.fetchComplianceStatus(), api.fetchRequiredChecks()]);

    expect(status.passed + status.failed + status.missing).toBe(required.length);
    expect(status.score_pct).toBeCloseTo((status.passed / required.length) * 100, 1);
    expect(status.missing_checks).toHaveLength(status.missing);
  });
});
