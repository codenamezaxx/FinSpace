import { describe, it, expect, vi, beforeEach } from "vitest";

// Must use vi.hoisted so these exist when vi.mock factory runs (hoisted to top)
const { mockToArray, mockCount, mockBulkAdd, mockBulkDelete } = vi.hoisted(() => ({
  mockToArray: vi.fn().mockResolvedValue([]),
  mockCount: vi.fn().mockResolvedValue(0),
  mockBulkAdd: vi.fn().mockResolvedValue(undefined),
  mockBulkDelete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => ({
  db: {
    pockets: {
      toArray: mockToArray,
      count: mockCount,
      bulkAdd: mockBulkAdd,
      bulkDelete: mockBulkDelete,
    },
  },
}));

// Import AFTER mock setup
const { seedPresets, hasSeeded, resetSeedFlag } = await import("./seedPresets");

describe("seedPresets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSeedFlag();
    // Default: no existing pockets
    mockToArray.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it("adds all 6 presets when DB is empty", async () => {
    await seedPresets();

    expect(mockBulkAdd).toHaveBeenCalledOnce();
    const added = mockBulkAdd.mock.calls[0][0];
    expect(added).toHaveLength(6);
    expect(added.map((p: { name: string }) => p.name)).toEqual([
      "Tunai", "Dana", "Gopay", "BCA", "Seabank", "Bank Jago",
    ]);
  });

  it("is idempotent — second call is a no-op", async () => {
    await seedPresets();
    vi.clearAllMocks();

    await seedPresets();
    expect(mockBulkAdd).not.toHaveBeenCalled();
  });

  it("deduplicates by name before seeding", async () => {
    // First toArray call: dedup finds 2 dupes
    mockToArray.mockResolvedValueOnce([
      { id: "1", name: "Tunai" },
      { id: "2", name: "Tunai" },
      { id: "3", name: "Dana" },
      { id: "4", name: "Dana" },
    ]);
    // After dedup, only Tunai and Dana remain (2 items)
    mockToArray.mockResolvedValueOnce([
      { id: "1", name: "Tunai" },
      { id: "3", name: "Dana" },
    ]);
    mockCount.mockResolvedValue(2);

    await seedPresets();

    // Should delete duplicates
    expect(mockBulkDelete).toHaveBeenCalledOnce();
    const deletedIds = mockBulkDelete.mock.calls[0][0];
    expect(deletedIds).toContain("2"); // dup Tunai
    expect(deletedIds).toContain("4"); // dup Dana

    // Should add only missing presets (4)
    expect(mockBulkAdd).toHaveBeenCalledOnce();
    const added = mockBulkAdd.mock.calls[0][0];
    expect(added).toHaveLength(4);
    expect(added.map((p: { name: string }) => p.name)).toEqual([
      "Gopay", "BCA", "Seabank", "Bank Jago",
    ]);
  });

  it("adds nothing when all presets already exist", async () => {
    const allSix = [
      { id: "1", name: "Tunai" },
      { id: "2", name: "Dana" },
      { id: "3", name: "Gopay" },
      { id: "4", name: "BCA" },
      { id: "5", name: "Seabank" },
      { id: "6", name: "Bank Jago" },
    ];
    // First call: dedup step. Second call: name check step.
    mockToArray.mockResolvedValueOnce(allSix);
    mockToArray.mockResolvedValueOnce(allSix);

    await seedPresets();

    expect(mockBulkDelete).not.toHaveBeenCalled();
    expect(mockBulkAdd).not.toHaveBeenCalled();
  });

  it("hasSeeded returns true after successful seed", async () => {
    expect(hasSeeded()).toBe(false);
    await seedPresets();
    expect(hasSeeded()).toBe(true);
  });

  it("resetSeedFlag allows re-seeding", async () => {
    await seedPresets();
    expect(hasSeeded()).toBe(true);

    resetSeedFlag();
    expect(hasSeeded()).toBe(false);
  });
});
