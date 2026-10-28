import { Monitor, Router, Smartphone, Tv, Server, HelpCircle } from "lucide-react";

export const deviceIcons: Record<string, typeof Monitor> = {
  router: Router,
  desktop: Monitor,
  mobile: Smartphone,
  tv: Tv,
  server: Server,
  unknown: HelpCircle,
};
