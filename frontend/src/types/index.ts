export interface Device {
  id: string;
  ip_address: string;
  mac_address: string | null;
  hostname: string | null;
  vendor: string | null;
  device_type: string;
  os_info: string | null;
  is_online: boolean;
  is_trusted: boolean;
  notes: string | null;
  first_seen: string;
  last_seen: string;
  created_at: string;
  open_ports?: Record<string, PortInfo> | null;
}

export interface PortInfo {
  protocol: string;
  service: string;
  product: string | null;
  version: string | null;
  state: string;
}

export interface Scan {
  id: string;
  scan_type: string;
  status: string;
  target_network: string;
  devices_found: number;
  open_ports_found: number;
  duration_seconds: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Alert {
  id: string;
  device_id: string | null;
  alert_type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  status: "open" | "acknowledged" | "resolved";
  source_ip: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface TrafficLog {
  id: string;
  source_ip: string;
  destination_ip: string;
  source_port: number | null;
  destination_port: number | null;
  protocol: string;
  bytes_sent: number;
  bytes_received: number;
  packet_count: number;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_suspicious: boolean;
  created_at: string;
}

export interface DashboardData {
  devices: {
    total: number;
    online: number;
    offline: number;
    types: Record<string, number>;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  last_scan: {
    id: string | null;
    type: string | null;
    status: string | null;
    devices_found: number;
    started_at: string | null;
  };
  traffic: {
    total_bytes: number;
    suspicious_connections: number;
  };
  recent_alerts: {
    id: string;
    severity: string;
    title: string;
    status: string;
    created_at: string;
  }[];
}

export interface TrafficSummary {
  window_hours: number;
  total_bytes: number;
  protocols: { protocol: string; connections: number }[];
  top_destinations: { ip: string; country: string | null; city: string | null; bytes: number; connections: number }[];
  countries: { country: string; connections: number; bytes: number }[];
  suspicious: {
    destination_ip: string;
    destination_port: number | null;
    country: string | null;
    city: string | null;
    bytes: number;
    connections: number;
  }[];
  hourly: { hour: string; inbound_bytes: number; outbound_bytes: number; suspicious: number }[];
}

export interface ComplianceCheck {
  id: string;
  check_date: string;
  check_type: string;
  criteria: string;
  status: "pass" | "fail" | "na";
  notes: string | null;
  evidence_ref: string | null;
  checked_by: string;
  created_at: string;
}

export interface ComplianceStatus {
  check_date: string;
  total_checks: number;
  passed: number;
  failed: number;
  missing: number;
  score_pct: number;
  checks: ComplianceCheck[];
  missing_checks: string[];
}

export interface RequiredCheck {
  check_type: string;
  criteria: string;
  description: string;
}

export interface ComplianceHistoryDay {
  date: string;
  score_pct: number;
  passed: number;
  total: number;
}
