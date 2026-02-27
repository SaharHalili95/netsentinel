import axios from "axios";
import type { DashboardData, Device, Scan, Alert } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Dashboard
export const fetchDashboard = () =>
  api.get<DashboardData>("/api/dashboard").then((r) => r.data);

// Devices
export const fetchDevices = (params?: { online_only?: boolean }) =>
  api.get<Device[]>("/api/devices", { params }).then((r) => r.data);

export const fetchDevice = (id: string) =>
  api.get<Device>(`/api/devices/${id}`).then((r) => r.data);

export const updateDevice = (id: string, data: Partial<Device>) =>
  api.patch<Device>(`/api/devices/${id}`, data).then((r) => r.data);

export const deleteDevice = (id: string) =>
  api.delete(`/api/devices/${id}`).then((r) => r.data);

// Scans
export const fetchScans = (params?: { scan_type?: string; limit?: number }) =>
  api.get<Scan[]>("/api/scans", { params }).then((r) => r.data);

export const createScan = (data: { scan_type: string; target_network?: string }) =>
  api.post<Scan>("/api/scans", data).then((r) => r.data);

// Alerts
export const fetchAlerts = (params?: { status?: string; severity?: string; limit?: number }) =>
  api.get<Alert[]>("/api/alerts", { params }).then((r) => r.data);

export const fetchAlertCounts = () =>
  api.get<Record<string, number>>("/api/alerts/counts").then((r) => r.data);

export const updateAlert = (id: string, data: { status: string }) =>
  api.patch<Alert>(`/api/alerts/${id}`, data).then((r) => r.data);

export const resolveAllAlerts = () =>
  api.post("/api/alerts/resolve-all").then((r) => r.data);

export default api;
