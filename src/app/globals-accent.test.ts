import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("accent mono tokens", () => {
  it("defines light mono overrides", () => {
    expect(css).toContain('[data-accent="mono"]');
    expect(css).toContain("--color-primary: #525252;");
    expect(css).toContain("--color-accent-secondary: #737373;");
  });
  it("defines dark mono overrides with higher specificity after dark block", () => {
    const darkIdx = css.indexOf('[data-theme="dark"]');
    const monoDarkIdx = css.indexOf('[data-theme="dark"][data-accent="mono"]');
    expect(darkIdx).toBeGreaterThanOrEqual(0);
    expect(monoDarkIdx).toBeGreaterThan(darkIdx);
    expect(css).toContain("--color-background: #0A0A0A;");
  });
  it("never overrides indicators in mono blocks", () => {
    const lightMono = css.slice(css.indexOf('[data-accent="mono"]'));
    expect(lightMono).not.toContain("--color-success");
    expect(lightMono).not.toContain("--color-danger");
  });
});
