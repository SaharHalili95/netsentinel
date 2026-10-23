import { AlertTriangle, Info, XCircle } from "lucide-react";

export const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
};
