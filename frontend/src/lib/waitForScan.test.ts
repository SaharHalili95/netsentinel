import { describe, expect, it, vi } from "vitest";
import { waitForScan } from "./waitForScan";
import type { Scan } from "@/types";

const scan = (status: string) => ({ id: "s1", status }) as Scan;

describe("waitForScan", () => {
  it("polls until the scan is no longer queued or running", async () => {
    const fetchScan = vi.fn()
      .mockResolvedValueOnce(scan("queued"))
      .mockResolvedValueOnce(scan("running"))
      .mockResolvedValueOnce(scan("completed"));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await waitForScan("s1", fetchScan, { sleep });

    expect(result.status).toBe("completed");
    expect(fetchScan).toHaveBeenCalledTimes(3);
  });

  it("returns a failed scan as finished", async () => {
    const fetchScan = vi.fn().mockResolvedValue(scan("failed"));

    expect((await waitForScan("s1", fetchScan, { sleep: async () => {} })).status).toBe("failed");
  });

  it("gives up after maxTries and returns the last state", async () => {
    const fetchScan = vi.fn().mockResolvedValue(scan("running"));

    const result = await waitForScan("s1", fetchScan, { sleep: async () => {}, maxTries: 4 });

    expect(result.status).toBe("running");
    expect(fetchScan).toHaveBeenCalledTimes(4);
  });
});
