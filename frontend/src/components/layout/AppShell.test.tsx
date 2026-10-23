import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/alerts/" }));
vi.mock("@/lib/websocket", () => ({ useWebSocket: () => ({ isConnected: false, lastMessage: null }) }));
vi.mock("@/lib/api", () => ({
  isDemo: true,
  fetchAlertCounts: () => Promise.resolve({ total: 4 }),
}));

beforeEach(() => localStorage.clear());

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

    expect(screen.getByRole("link", { name: "Alerts" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Devices" })).not.toHaveAttribute("aria-current");
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
});
