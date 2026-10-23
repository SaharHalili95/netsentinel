import type {
  Alert,
  ComplianceHistoryDay,
  ComplianceStatus,
  DashboardData,
  Device,
  RequiredCheck,
  Scan,
  TrafficSummary,
} from "@/types";
import {
  DEMO_FLOWS,
  PASSED_HISTORY,
  REQUIRED_CHECKS,
  SOC2_CRITERIA,
  seedAlerts,
  seedDevices,
  seedScans,
  seedTodayChecks,
} from "@/lib/demo/data";

// In-browser stand-in for the API, used by the public demo build. Changes live until reload.
let store = createStore();

function createStore() {
  return { devices: seedDevices(), alerts: seedAlerts(), scans: seedScans() };
}

export function resetDemo() {
  store = createStore();
}

const copy = <T,>(value: T): Promise<T> => Promise.resolve(structuredClone(value));

function notFound(kind: string, id: string): never {
  throw new Error(`${kind} ${id} not found`);
}

function openAlertCounts() {
  const open = store.alerts.filter((a) => a.status === "open");
  const count = (s: Alert["severity"]) => open.filter((a) => a.severity === s).length;
  return {
    critical: count("critical"),
    high: count("high"),
    medium: count("medium"),
    low: count("low"),
    info: count("info"),
    total: open.length,
  };
}

export async function fetchDashboard(): Promise<DashboardData> {
  const types: Record<string, number> = {};
  for (const d of store.devices) types[d.device_type] = (types[d.device_type] ?? 0) + 1;
  const last = store.scans[0];
  const traffic = await fetchTrafficSummary();

  return copy({
    devices: {
      total: store.devices.length,
      online: store.devices.filter((d) => d.is_online).length,
      offline: store.devices.filter((d) => !d.is_online).length,
      types,
    },
    alerts: openAlertCounts(),
    last_scan: {
      id: last?.id ?? null,
      type: last?.scan_type ?? null,
      status: last?.status ?? null,
      devices_found: last?.devices_found ?? 0,
      started_at: last?.started_at ?? null,
    },
    traffic: {
      total_bytes: traffic.total_bytes,
      suspicious_connections: traffic.suspicious.reduce((n, s) => n + s.connections, 0),
    },
    recent_alerts: [...store.alerts]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map(({ id, severity, title, status, created_at }) => ({ id, severity, title, status, created_at })),
  });
}

export const fetchDevices = (params?: { online_only?: boolean }) =>
  copy(params?.online_only ? store.devices.filter((d) => d.is_online) : store.devices);

export const fetchDevice = (id: string) =>
  copy(store.devices.find((d) => d.id === id) ?? notFound("Device", id));

export async function updateDevice(id: string, data: Partial<Device>): Promise<Device> {
  const device = store.devices.find((d) => d.id === id) ?? notFound("Device", id);
  Object.assign(device, data);
  return copy(device);
}

export async function deleteDevice(id: string) {
  store.devices = store.devices.filter((d) => d.id !== id);
  return { deleted: id };
}

export const fetchScans = (params?: { scan_type?: string; limit?: number }) =>
  copy(
    store.scans
      .filter((s) => !params?.scan_type || s.scan_type === params.scan_type)
      .slice(0, params?.limit ?? 50)
  );

export const fetchScan = (id: string) =>
  copy(store.scans.find((s) => s.id === id) ?? notFound("Scan", id));

export async function createScan(data: { scan_type: string; target_network?: string }): Promise<Scan> {
  const online = store.devices.filter((d) => d.is_online);
  const ports = data.scan_type === "discovery" ? 0 : online.reduce((n, d) => n + Object.keys(d.open_ports ?? {}).length, 0);
  const now = new Date().toISOString();
  const scan: Scan = {
    id: `s${Date.now()}`,
    scan_type: data.scan_type,
    status: "completed",
    target_network: data.target_network ?? "192.168.1.0/24",
    devices_found: online.length,
    open_ports_found: ports,
    duration_seconds: data.scan_type === "discovery" ? 11.2 : 46.9,
    error_message: null,
    started_at: now,
    completed_at: now,
  };
  store.scans.unshift(scan);
  return copy(scan);
}

export const fetchAlerts = (params?: { status?: string; severity?: string; limit?: number }) =>
  copy(
    store.alerts
      .filter((a) => (!params?.status || a.status === params.status) && (!params?.severity || a.severity === params.severity))
      .slice(0, params?.limit ?? 50)
  );

export const fetchAlertCounts = () => copy<Record<string, number>>(openAlertCounts());

export async function updateAlert(id: string, data: { status: string }): Promise<Alert> {
  const alert = store.alerts.find((a) => a.id === id) ?? notFound("Alert", id);
  alert.status = data.status as Alert["status"];
  alert.resolved_at = data.status === "resolved" ? new Date().toISOString() : null;
  return copy(alert);
}

export async function resolveAllAlerts() {
  const now = new Date().toISOString();
  let resolved = 0;
  for (const a of store.alerts) {
    if (a.status !== "resolved") {
      a.status = "resolved";
      a.resolved_at = now;
      resolved++;
    }
  }
  return { resolved };
}

export async function fetchTrafficSummary(hours = 24): Promise<TrafficSummary> {
  const newest = new Date();
  newest.setMinutes(0, 0, 0);
  const hourly = Array.from({ length: hours }, (_, i) => ({
    hour: new Date(newest.getTime() - (hours - 1 - i) * 3_600_000).toISOString(),
    inbound_bytes: 0,
    outbound_bytes: 0,
    suspicious: 0,
  }));
  const protocols: Record<string, number> = {};
  const destinations = new Map<string, TrafficSummary["top_destinations"][number]>();
  const countries = new Map<string, TrafficSummary["countries"][number]>();
  const suspicious: TrafficSummary["suspicious"] = [];
  let total = 0;

  for (const flow of DEMO_FLOWS) {
    const seen = flow.hours.filter((h) => h < hours);
    if (seen.length === 0) continue;
    const bytes = (flow.sent + flow.received) * seen.length;
    total += bytes;
    protocols[flow.protocol] = (protocols[flow.protocol] ?? 0) + seen.length;
    for (const h of seen) {
      const bucket = hourly[hours - 1 - h];
      bucket.inbound_bytes += flow.received;
      bucket.outbound_bytes += flow.sent;
      if (flow.suspicious) bucket.suspicious++;
    }
    destinations.set(flow.destination_ip, { ip: flow.destination_ip, country: flow.country, city: flow.city, bytes, connections: seen.length });
    if (flow.country) {
      const c = countries.get(flow.country) ?? { country: flow.country, connections: 0, bytes: 0 };
      c.connections += seen.length;
      c.bytes += bytes;
      countries.set(flow.country, c);
    }
    if (flow.suspicious) {
      suspicious.push({ destination_ip: flow.destination_ip, destination_port: flow.destination_port, country: flow.country, city: flow.city, bytes, connections: seen.length });
    }
  }

  return copy({
    window_hours: hours,
    total_bytes: total,
    protocols: Object.entries(protocols)
      .sort((a, b) => b[1] - a[1])
      .map(([protocol, connections]) => ({ protocol, connections })),
    top_destinations: [...destinations.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    countries: [...countries.values()].sort((a, b) => b.connections - a.connections),
    suspicious: suspicious.sort((a, b) => b.connections - a.connections),
    hourly,
  });
}

export async function fetchComplianceStatus(): Promise<ComplianceStatus> {
  const checks = seedTodayChecks();
  const done = new Set(checks.map((c) => c.check_type));
  const passed = checks.filter((c) => c.status === "pass").length;
  const missing = REQUIRED_CHECKS.filter((c) => !done.has(c.check_type)).map((c) => c.check_type);
  return copy({
    check_date: checks[0].check_date,
    total_checks: checks.length,
    passed,
    failed: checks.filter((c) => c.status === "fail").length,
    missing: missing.length,
    score_pct: Math.round((passed / REQUIRED_CHECKS.length) * 1000) / 10,
    checks,
    missing_checks: missing,
  });
}

export const fetchComplianceHistory = (days = 30) =>
  copy<ComplianceHistoryDay[]>(
    PASSED_HISTORY.slice(0, days).map((passed, i) => ({
      date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
      score_pct: Math.round((passed / REQUIRED_CHECKS.length) * 1000) / 10,
      passed,
      total: i === 0 ? seedTodayChecks().length : REQUIRED_CHECKS.length,
    }))
  );

export const fetchRequiredChecks = () => copy<RequiredCheck[]>(REQUIRED_CHECKS);

export const fetchCriteria = () => copy(SOC2_CRITERIA);
