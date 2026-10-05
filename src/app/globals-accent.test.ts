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

describe("@theme accent indirection", () => {
  const themeBlock = css.slice(
    css.indexOf("@theme inline {"),
    css.indexOf("/* ─── Default theme tokens (light) ─── */")
  );

  it("routes primary/accent through vars, not hardcoded hex", () => {
    expect(themeBlock).toContain("--color-primary: var(--color-primary);");
    expect(themeBlock).toContain("--color-primary-hover: var(--color-primary-hover);");
    expect(themeBlock).toContain("--color-accent: var(--color-accent);");
    expect(themeBlock).toContain("--color-accent-secondary: var(--color-accent-secondary);");
    expect(themeBlock).not.toContain("#3B82F6");
    expect(themeBlock).not.toContain("#EAB393");
    expect(themeBlock).not.toContain("#8940F9");
  });

  it("defines primary defaults in :root", () => {
    const rootBlock = css.slice(
      css.indexOf("/* ─── Default theme tokens (light) ─── */"),
      css.indexOf("/* ─── Dark Theme Override ─── */")
    );
    expect(rootBlock).toContain("--color-primary:");
    expect(rootBlock).toContain("--color-primary-hover:");
  });
});
