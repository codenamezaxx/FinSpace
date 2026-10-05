import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync("src/app/layout.tsx", "utf8");

describe("layout theme overrides", () => {
  it("keeps light/dark display helpers", () => {
    expect(layout).toContain(".light-only");
    expect(layout).toContain(".dark-only");
  });

  it("does not pin theme colors with !important", () => {
    expect(layout).not.toContain('[data-theme="dark"] .bg-');
    expect(layout).not.toContain('[data-theme="dark"] .text-');
    expect(layout).not.toContain('[data-theme="dark"] .border-');
    expect(layout).not.toContain('[data-theme="dark"] .glass');
    expect(layout).not.toContain('[data-theme="dark"] .hover');
  });
});
