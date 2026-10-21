import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("accent mono tokens", () => {
  it("defines light mono overrides", () => {
    expect(css).toContain('[data-accent="mono"]');
    expect(css).toContain("--color-primary: #141414;");
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
    expect(rootBlock).toContain("--color-on-primary:");
  });
});

describe("on-primary button text token", () => {
  const themeBlock = css.slice(
    css.indexOf("@theme inline {"),
    css.indexOf("/* ─── Default theme tokens (light) ─── */")
  );

  it("routes on-primary through vars", () => {
    expect(themeBlock).toContain("--color-on-primary: var(--color-on-primary);");
  });

  it("uses near-black text on light-gray button in dark mono", () => {
    const monoDark = css.slice(css.indexOf('[data-theme="dark"][data-accent="mono"]'));
    expect(monoDark).toContain("--color-primary: #e3e3e3;");
    expect(monoDark).toContain("--color-on-primary: #0A0A0A;");
  });
});

describe("accent new palettes (ember/aqua/nebula/bloom)", () => {
  const NEW_ACCENTS = [
    {
      id: "ember",
      onPrimaryLight: "#FFFFFF",
      onPrimaryDark: "#1A1206",
      primaryLight: "#C2410C",
      primaryDark: "#F59E0B",
    },
    {
      id: "aqua",
      onPrimaryLight: "#FFFFFF",
      onPrimaryDark: "#04211F",
      primaryLight: "#0F766E",
      primaryDark: "#2DD4BF",
    },
    {
      id: "nebula",
      onPrimaryLight: "#FFFFFF",
      onPrimaryDark: "#160B33",
      primaryLight: "#7C3AED",
      primaryDark: "#A78BFA",
    },
    {
      id: "bloom",
      onPrimaryLight: "#FFFFFF",
      onPrimaryDark: "#2A0A12",
      primaryLight: "#BE123C",
      primaryDark: "#FB7185",
    },
  ];
  const monoDarkIdx = css.indexOf('[data-theme="dark"][data-accent="mono"]');

  for (const a of NEW_ACCENTS) {
    describe(a.id, () => {
      const lightSel = `[data-accent="${a.id}"]`;
      const darkSel = `[data-theme="dark"][data-accent="${a.id}"]`;

      it("defines light and dark blocks, dark after mono dark", () => {
        const lightIdx = css.indexOf(lightSel);
        const darkIdx = css.indexOf(darkSel);
        expect(lightIdx).toBeGreaterThan(0);
        expect(darkIdx).toBeGreaterThan(lightIdx);
        expect(darkIdx).toBeGreaterThan(monoDarkIdx);
      });

      it("sets primary and on-primary per spec", () => {
        const light = css.slice(css.indexOf(lightSel), css.indexOf(darkSel));
        const dark = css.slice(css.indexOf(darkSel));
        expect(light).toContain(`--color-primary: ${a.primaryLight};`);
        expect(light).toContain(`--color-on-primary: ${a.onPrimaryLight};`);
        expect(dark).toContain(`--color-primary: ${a.primaryDark};`);
        expect(dark).toContain(`--color-on-primary: ${a.onPrimaryDark};`);
      });

      it("never overrides success/danger indicators", () => {
        const light = css.slice(css.indexOf(lightSel), css.indexOf(darkSel));
        const dark = css.slice(css.indexOf(darkSel));
        for (const block of [light, dark]) {
          expect(block).not.toContain("--color-success");
          expect(block).not.toContain("--color-danger");
        }
      });
    });
  }
});

describe("modal backdrop token (--backdrop-bg)", () => {
  const lightBlock = css.slice(
    css.indexOf("/* ─── Default theme tokens (light) ─── */"),
    css.indexOf("/* ─── Dark Theme Override ─── */")
  );
  const darkBlock = css.slice(
    css.indexOf("/* ─── Dark Theme Override ─── */"),
    css.indexOf("/* ─── Accent variant: default (dokumentatif, nilai = baseline) ─── */")
  );

  const readScrim = (block: string, label: string) => {
    const m = block.match(/--backdrop-bg:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (!m) throw new Error(`--backdrop-bg missing or not rgba() in ${label} block`);
    return { r: +m[1], g: +m[2], b: +m[3], a: +m[4] };
  };

  // Scrim must be a neutral darkening layer: any chromatic cast tints every
  // modal behind it (R/G/B must be 0), and it must be genuinely dark (a >= 0.3).
  it("light scrim is neutral black, not tinted", () => {
    const { r, g, b, a } = readScrim(lightBlock, "light");
    expect([r, g, b]).toEqual([0, 0, 0]);
    expect(a).toBeGreaterThanOrEqual(0.3);
    expect(a).toBeLessThan(1);
  });

  it("dark scrim is neutral black, not tinted", () => {
    const { r, g, b, a } = readScrim(darkBlock, "dark");
    expect([r, g, b]).toEqual([0, 0, 0]);
    expect(a).toBeGreaterThanOrEqual(0.3);
    expect(a).toBeLessThan(1);
  });
});
