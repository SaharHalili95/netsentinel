import type { Alert, ComplianceCheck, Device, RequiredCheck, Scan } from "@/types";

// Sample home network for the public demo. Times are relative to when the page loads.
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export function seedDevices(): Device[] {
  const base = { os_info: null, notes: null, created_at: ago(60 * DAY) };
  return [
    { ...base, id: "d1", ip_address: "192.168.1.1", mac_address: "50:C7:BF:12:34:01", hostname: "router.local", vendor: "TP-Link", device_type: "router", os_info: "OpenWrt 23.05", is_online: true, is_trusted: true, first_seen: ago(60 * DAY), last_seen: ago(MIN),
      open_ports: { "53": { protocol: "udp", service: "domain", product: "dnsmasq", version: "2.89", state: "open" }, "80": { protocol: "tcp", service: "http", product: "LuCI", version: null, state: "open" }, "443": { protocol: "tcp", service: "https", product: "LuCI", version: null, state: "open" } } },
    { ...base, id: "d2", ip_address: "192.168.1.100", mac_address: "B4:2E:99:AB:10:02", hostname: "desktop-pc", vendor: "Dell", device_type: "desktop", os_info: "Windows 11", is_online: true, is_trusted: true, first_seen: ago(45 * DAY), last_seen: ago(2 * MIN),
      open_ports: { "22": { protocol: "tcp", service: "ssh", product: "OpenSSH", version: "9.5", state: "open" }, "3389": { protocol: "tcp", service: "ms-wbt-server", product: "Microsoft Terminal Services", version: null, state: "open" } } },
    { ...base, id: "d3", ip_address: "192.168.1.101", mac_address: "F0:18:98:3C:22:03", hostname: "iphone", vendor: "Apple", device_type: "mobile", os_info: "iOS 18", is_online: true, is_trusted: true, first_seen: ago(30 * DAY), last_seen: ago(4 * MIN) },
    { ...base, id: "d4", ip_address: "192.168.1.102", mac_address: "8C:79:F5:61:44:04", hostname: "living-room-tv", vendor: "Samsung", device_type: "tv", is_online: true, is_trusted: false, first_seen: ago(20 * DAY), last_seen: ago(3 * MIN),
      open_ports: { "8001": { protocol: "tcp", service: "http-alt", product: null, version: null, state: "open" } } },
    { ...base, id: "d5", ip_address: "192.168.1.110", mac_address: "DC:A6:32:9E:55:05", hostname: "nas", vendor: "Raspberry Pi Foundation", device_type: "server", os_info: "Debian 12", is_online: true, is_trusted: true, first_seen: ago(50 * DAY), last_seen: ago(MIN),
      open_ports: { "22": { protocol: "tcp", service: "ssh", product: "OpenSSH", version: "9.2", state: "open" }, "445": { protocol: "tcp", service: "microsoft-ds", product: "Samba", version: "4.17", state: "open" } } },
    { ...base, id: "d6", ip_address: "192.168.1.150", mac_address: "3E:91:0A:7B:66:06", hostname: null, vendor: null, device_type: "unknown", is_online: true, is_trusted: false, first_seen: ago(40 * MIN), last_seen: ago(MIN) },
    { ...base, id: "d7", ip_address: "192.168.1.103", mac_address: "54:EE:75:20:77:07", hostname: "old-laptop", vendor: "Lenovo", device_type: "desktop", is_online: false, is_trusted: true, first_seen: ago(58 * DAY), last_seen: ago(3 * DAY) },
  ];
}

// Titles, severities and wording follow backend/app/services/anomaly_detector.py and scanner.py.
export function seedAlerts(): Alert[] {
  const base = { resolved_at: null };
  return [
    { ...base, id: "a1", device_id: "d6", alert_type: "suspicious_port", severity: "high", title: "Suspicious port connection: 185.220.101.4:4444", description: "Device 192.168.1.150 connected to suspicious port 4444 on 185.220.101.4", status: "open", source_ip: "192.168.1.150", created_at: ago(6 * MIN) },
    { ...base, id: "a2", device_id: "d6", alert_type: "new_device", severity: "medium", title: "New device discovered: 192.168.1.150", description: "A new device was found on the network. IP: 192.168.1.150, MAC: 3E:91:0A:7B:66:06, Hostname: N/A", status: "open", source_ip: "192.168.1.150", created_at: ago(40 * MIN) },
    { ...base, id: "a3", device_id: "d6", alert_type: "watchlist_country", severity: "medium", title: "Connection to watchlist country: Russia", description: "Device 192.168.1.150 communicated with 95.213.4.18 in Russia (Saint Petersburg)", status: "open", source_ip: "192.168.1.150", created_at: ago(35 * MIN) },
    { ...base, id: "a4", device_id: "d2", alert_type: "open_port", severity: "high", title: "Suspicious ports open on 192.168.1.100", description: "Potentially risky ports detected: 3389 on device desktop-pc", status: "acknowledged", source_ip: "192.168.1.100", created_at: ago(5 * HOUR) },
    { ...base, id: "a5", device_id: "d4", alert_type: "traffic_spike", severity: "medium", title: "High traffic volume from 192.168.1.102", description: "Device 192.168.1.102 generated 1184 connections and 812400000 bytes in the last hour", status: "open", source_ip: "192.168.1.102", created_at: ago(9 * HOUR) },
    { id: "a6", device_id: "d5", alert_type: "open_port", severity: "high", title: "Suspicious ports open on 192.168.1.110", description: "Potentially risky ports detected: 445 on device nas", status: "resolved", source_ip: "192.168.1.110", resolved_at: ago(20 * HOUR), created_at: ago(26 * HOUR) },
  ];
}

export function seedScans(): Scan[] {
  return [
    { id: "s1", scan_type: "discovery", status: "completed", target_network: "192.168.1.0/24", devices_found: 6, open_ports_found: 0, duration_seconds: 11.8, error_message: null, started_at: ago(5 * MIN), completed_at: ago(5 * MIN - 11_800) },
    { id: "s2", scan_type: "port_scan", status: "completed", target_network: "192.168.1.0/24", devices_found: 6, open_ports_found: 9, duration_seconds: 47.2, error_message: null, started_at: ago(HOUR), completed_at: ago(HOUR - 47_200) },
    { id: "s3", scan_type: "full", status: "completed", target_network: "192.168.1.0/24", devices_found: 7, open_ports_found: 9, duration_seconds: 63.5, error_message: null, started_at: ago(DAY), completed_at: ago(DAY - 63_500) },
    { id: "s4", scan_type: "full", status: "failed", target_network: "10.0.0.0/24", devices_found: 0, open_ports_found: 0, duration_seconds: 5.1, error_message: "Network unreachable", started_at: ago(2 * DAY), completed_at: ago(2 * DAY - 5_100) },
  ];
}

export interface DemoFlow {
  destination_ip: string;
  destination_port: number;
  protocol: string;
  country: string | null;
  city: string | null;
  sent: number;
  received: number;
  suspicious?: boolean;
  hours: number[];
}

// One entry per recurring connection; `hours` lists how many hours ago it happened.
const EVERY_HOUR = Array.from({ length: 24 }, (_, i) => i);
export const DEMO_FLOWS: DemoFlow[] = [
  { destination_ip: "8.8.8.8", destination_port: 53, protocol: "UDP", country: "United States", city: "Mountain View", sent: 40_000, received: 90_000, hours: EVERY_HOUR },
  { destination_ip: "140.82.121.4", destination_port: 443, protocol: "TCP", country: "United States", city: "San Francisco", sent: 600_000, received: 4_200_000, hours: EVERY_HOUR.filter((h) => h % 2 === 0) },
  { destination_ip: "151.101.1.140", destination_port: 443, protocol: "TCP", country: "United States", city: "San Francisco", sent: 300_000, received: 9_800_000, hours: EVERY_HOUR.filter((h) => h < 14) },
  { destination_ip: "17.253.144.10", destination_port: 443, protocol: "TCP", country: "United States", city: "Cupertino", sent: 150_000, received: 2_600_000, hours: [1, 3, 7, 9, 12, 18, 22] },
  { destination_ip: "52.29.110.7", destination_port: 443, protocol: "TCP", country: "Germany", city: "Frankfurt", sent: 220_000, received: 1_900_000, hours: [0, 2, 4, 6, 8, 10] },
  { destination_ip: "31.13.66.35", destination_port: 443, protocol: "TCP", country: "Ireland", city: "Dublin", sent: 180_000, received: 3_100_000, hours: [0, 1, 5, 6, 11, 16, 19, 20] },
  { destination_ip: "13.107.42.14", destination_port: 443, protocol: "TCP", country: "Netherlands", city: "Amsterdam", sent: 90_000, received: 700_000, hours: [2, 10, 15] },
  { destination_ip: "192.168.1.1", destination_port: 0, protocol: "ICMP", country: null, city: null, sent: 2_000, received: 2_000, hours: EVERY_HOUR },
  { destination_ip: "185.220.101.4", destination_port: 4444, protocol: "TCP", country: "Germany", city: "Berlin", sent: 1_400_000, received: 80_000, suspicious: true, hours: [0] },
  { destination_ip: "95.213.4.18", destination_port: 6667, protocol: "TCP", country: "Russia", city: "Saint Petersburg", sent: 260_000, received: 40_000, suspicious: true, hours: [0, 1] },
];

export const REQUIRED_CHECKS: RequiredCheck[] = [
  { check_type: "alerts_reviewed", criteria: "CC7.2", description: "All open security alerts have been reviewed" },
  { check_type: "access_review", criteria: "CC6.1", description: "Privileged access list reviewed — no unauthorized accounts" },
  { check_type: "backup_verified", criteria: "A1.2", description: "Database backup completed and verified" },
  { check_type: "vulnerability_scan", criteria: "CC7.1", description: "Vulnerability scan executed and results reviewed" },
  { check_type: "incident_log_reviewed", criteria: "CC7.3", description: "Incident log reviewed and all incidents have owners" },
  { check_type: "system_availability", criteria: "A1.1", description: "All services are healthy and meeting uptime SLA" },
];

export const SOC2_CRITERIA: Record<string, string> = {
  "CC6.1": "Logical access security measures restrict access to information assets",
  "CC6.2": "New internal and external users are registered and granted access",
  "CC6.3": "Access is removed when no longer required",
  "CC7.1": "Security vulnerabilities are identified and monitored",
  "CC7.2": "Security incidents are identified and responded to",
  "CC7.3": "Security incidents are evaluated and contained",
  "A1.1": "System availability meets performance commitments",
  "A1.2": "Environmental protections and redundancy support availability",
};

export function seedTodayChecks(): ComplianceCheck[] {
  const today = new Date().toISOString().slice(0, 10);
  const done: [string, ComplianceCheck["status"], string | null][] = [
    ["alerts_reviewed", "pass", null],
    ["access_review", "pass", null],
    ["backup_verified", "pass", "nightly-backup.log"],
    ["vulnerability_scan", "fail", "RDP open on desktop-pc"],
  ];
  return done.map(([type, status, notes], i) => ({
    id: `c${i + 1}`,
    check_date: today,
    check_type: type,
    criteria: REQUIRED_CHECKS.find((c) => c.check_type === type)!.criteria,
    status,
    notes,
    evidence_ref: null,
    checked_by: "system",
    created_at: ago((i + 1) * HOUR),
  }));
}

// Past 30 days of passed-check counts, newest first, for the history chart.
export const PASSED_HISTORY = [3, 6, 6, 5, 6, 6, 4, 6, 5, 6, 6, 6, 3, 5, 6, 6, 6, 5, 6, 4, 6, 6, 5, 6, 6, 6, 2, 5, 6, 6];
