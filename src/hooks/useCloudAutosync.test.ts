import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { mockSync } = vi.hoisted(() => ({
  mockSync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: { cloud: { sync: mockSync } },
}));

import { useCloudAutosync } from "./useCloudAutosync";

function setVisibility(state: string) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

describe("useCloudAutosync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setVisibility("visible");
  });

  it("syncs when the tab becomes visible", async () => {
    renderHook(() => useCloudAutosync());
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(mockSync).toHaveBeenCalled();
  });

  it("syncs when the browser comes back online", async () => {
    renderHook(() => useCloudAutosync());
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(mockSync).toHaveBeenCalled();
  });

  it("does nothing while the tab is hidden", async () => {
    renderHook(() => useCloudAutosync());
    setVisibility("hidden");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(mockSync).not.toHaveBeenCalled();
  });
});
