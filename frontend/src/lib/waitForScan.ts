import type { Scan } from "@/types";

const PENDING = new Set(["queued", "running"]);

interface Options {
  intervalMs?: number;
  maxTries?: number;
  sleep?: (ms: number) => Promise<void>;
}

// The real API queues scans and runs them in the background, so poll until they finish.
export async function waitForScan(
  id: string,
  fetchScan: (id: string) => Promise<Scan>,
  { intervalMs = 2000, maxTries = 90, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }: Options = {}
): Promise<Scan> {
  let scan = await fetchScan(id);
  for (let tries = 1; tries < maxTries && PENDING.has(scan.status); tries++) {
    await sleep(intervalMs);
    scan = await fetchScan(id);
  }
  return scan;
}
