import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/alerts/" }));
vi.mock("@/lib/websocket", () => ({ useWebSocket: () => ({ isConnected: false, lastMessage: null }) }));
const fetchAlertCounts = vi.fn();
vi.mock("@/lib/api", () => ({
  isDemo: true,
  fetchAlertCounts: () => fetchAlertCounts(),
}));

beforeEach(() => {
  localStorage.clear();
  fetchAlertCounts.mockResolvedValue({ total: 4 });
});

function renderShell() {
  return render(
    <AppShell>
      <h1>Page</h1>
    </AppShell>
  );
}

describe("AppShell", () => {
  it("drawer opens, Escape closes and restores focus", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeVisible();

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("active link has aria-current", () => {
    renderShell();

    const nav = within(screen.getByRole("navigation", { name: "Main" }));
    expect(nav.getByRole("link", { name: "Alerts" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Devices" })).not.toHaveAttribute("aria-current");
  });

  it("skip link targets #main", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main");
    expect(document.getElementById("main")).toContainElement(screen.getByRole("heading", { name: "Page" }));
  });

  it("bell shows the real open alert count", async () => {
    renderShell();

    await waitFor(() => expect(screen.getByRole("link", { name: "4 open alerts" })).toBeInTheDocument());
  });

  it("language button switches to Hebrew", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Switch to Hebrew" }));

    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("link", { name: "התראות" })).toBeInTheDocument();
  });

  it("bell shows no count when the alert count cannot be loaded", async () => {
    fetchAlertCounts.mockRejectedValue(new Error("down"));
    renderShell();

    await waitFor(() => expect(fetchAlertCounts).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: /open alerts/ })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Alerts" })).toHaveLength(2);
  });
});
