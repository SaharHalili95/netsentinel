import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsync } from "./useAsync";

describe("useAsync", () => {
  it("exposes the error and keeps data empty when the call fails", async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error("down"))));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect((result.current.error as Error).message).toBe("down");
    expect(result.current.data).toBeNull();
  });

  it("ignores a slow earlier response that finishes after a newer one", async () => {
    const resolvers: ((v: string) => void)[] = [];
    const { result } = renderHook(() =>
      useAsync(() => new Promise<string>((resolve) => resolvers.push(resolve)))
    );

    act(() => {
      result.current.reload();
    });
    await act(async () => {
      resolvers[1]("new");
      resolvers[0]("old");
    });

    expect(result.current.data).toBe("new");
  });
});
