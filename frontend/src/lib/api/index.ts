import * as demo from "./demo";
import * as http from "./http";

export const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

const client = isDemo ? demo : http;

export const {
  fetchDashboard,
  fetchDevices,
  fetchDevice,
  updateDevice,
  deleteDevice,
  fetchScans,
  fetchScan,
  createScan,
  fetchAlerts,
  fetchAlertCounts,
  updateAlert,
  resolveAllAlerts,
  fetchTrafficSummary,
  fetchComplianceStatus,
  fetchComplianceHistory,
  fetchRequiredChecks,
  fetchCriteria,
} = client;
