import type { jsPDF } from "jspdf";

/**
 * Low-level drawing primitives for the monthly statement PDF.
 * Kept separate from monthlyReportPdf.ts so the report file stays readable.
 */

export type RGB = [number, number, number];

/* ─── Brand palette (FinSpace) ─── */

export const C = {
  blue: [59, 130, 246] as RGB, // #3B82F6 primary
  blueDeep: [37, 99, 235] as RGB, // gradient end
  blueSoft: [219, 234, 254] as RGB, // chart area fill (blue-100)
  blueText: [191, 219, 254] as RGB, // text on blue banner
  green: [34, 197, 94] as RGB, // #22C55E income
  red: [239, 68, 68] as RGB, // #EF4444 expense
  dark: [30, 41, 59] as RGB, // #1E293B
  muted: [100, 116, 139] as RGB, // #64748B
  tint: [241, 245, 249] as RGB, // #F1F5F9 table head / cards
  tintAlt: [248, 250, 252] as RGB, // #F8FAFC zebra rows
  border: [226, 232, 240] as RGB, // #E2E8F0
  white: [255, 255, 255] as RGB,
};

/* ─── Page geometry (A4, mm) ─── */

export const GEO = {
  pageW: 210,
  pageH: 297,
  marginX: 18,
  bannerH: 36,
  bannerRadius: 10,
  contentTop: 46,
  contentBottom: 276,
  footerRuleY: 280,
} as const;

export const CONTENT_W = GEO.pageW - GEO.marginX * 2;

/* ─── Helpers ─── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
}

/** Fill a closed polygon described by absolute points. */
function fillPoly(doc: jsPDF, pts: [number, number][], color: RGB): void {
  if (pts.length < 3) return;
  doc.setFillColor(...color);
  const rel: number[][] = [];
  let [px, py] = pts[0];
  for (let i = 1; i < pts.length; i++) {
    rel.push([pts[i][0] - px, pts[i][1] - py]);
    px = pts[i][0];
    py = pts[i][1];
  }
  rel.push([pts[0][0] - px, pts[0][1] - py]);
  // jsPDF v4 requires scale as [scalex, scaley] — a bare number throws.
  doc.lines(rel, pts[0][0], pts[0][1], [1, 1], "F", true);
}

/** Points along a circular arc, angles in degrees (0 = east, y grows down). */
function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number): [number, number][] {
  const steps = Math.max(10, Math.ceil(Math.abs(a1 - a0) / 5));
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/* ─── Banner ─── */

/** Paint the bottom-right notch white so only that corner of the banner is rounded. */
function roundBottomRight(doc: jsPDF): void {
  const { pageW, bannerH: H, bannerRadius: R } = GEO;
  const cx = pageW - R;
  const cy = H - R;
  const pts: [number, number][] = [
    [pageW, cy],
    [pageW, H],
    [cx, H],
    ...arcPoints(cx, cy, R, 90, 0),
  ];
  fillPoly(doc, pts, C.white);
}

/** Gradient header band with rounded bottom-right corner. Idempotent — safe to redraw per page. */
export function drawBanner(doc: jsPDF): void {
  const { pageW, bannerH } = GEO;
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, pageW, bannerH, "F");
  const strips = 48;
  for (let i = 0; i < strips; i++) {
    const x0 = (pageW * i) / strips;
    doc.setFillColor(...mix(C.blue, C.blueDeep, i / (strips - 1)));
    doc.rect(x0, 0, pageW / strips + 0.2, bannerH, "F");
  }
  roundBottomRight(doc);
}

/** Wordmark (left) + document title + period (right) inside the banner. */
export function drawBannerText(doc: jsPDF, opts: { title: string; period: string; wordmark: string }): void {
  const { marginX, pageW } = GEO;
  // Icon tile - using logo image would be better, fallback to blue square with "F"
  doc.setFillColor(...C.blue);
  doc.roundedRect(marginX, 9, 8, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text("F", marginX + 4, 15, { align: "center" });
  // Wordmark
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text(opts.wordmark, marginX + 11, 16);
  // Title + period, right aligned
  doc.setFontSize(14);
  doc.text(opts.title, pageW - marginX, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.blueText);
  doc.text(opts.period, pageW - marginX, 21.5, { align: "right" });
}

/** "Page X of Y" stamped top-right of the banner in the final pass. */
export function drawPageLabel(doc: jsPDF, text: string): void {
  const { marginX, pageW } = GEO;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.blueText);
  doc.text(text, pageW - marginX, 29, { align: "right" });
}

/* ─── Section heading ─── */

/** Uppercase bold blue heading with a small accent square. Returns the next baseline. */
export function sectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...C.blue);
  doc.rect(GEO.marginX, y - 3.4, 2.4, 2.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.blue);
  doc.text(text.toUpperCase(), GEO.marginX + 4.5, y);
  return y + 6.5;
}

/* ─── Cards ─── */

export function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  doc.setFillColor(...C.tint);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
}

/* ─── Charts ─── */

function wedge(doc: jsPDF, cx: number, cy: number, r: number, a0: number, a1: number, color: RGB): void {
  const pts: [number, number][] = [[cx, cy], ...arcPoints(cx, cy, r, a0, a1)];
  fillPoly(doc, pts, color);
}

/** Donut chart. Segments with value <= 0 are skipped. Center hole is painted white. */
export function drawDonut(
  doc: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  segments: { value: number; color: RGB }[]
): void {
  const live = segments.filter((s) => s.value > 0);
  const total = live.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    doc.setFillColor(...C.border);
    doc.circle(cx, cy, rOuter, "F");
  } else {
    let angle = -90;
    const gap = live.length > 1 ? 1.4 : 0;
    for (const seg of live) {
      const sweep = (seg.value / total) * 360;
      wedge(doc, cx, cy, rOuter, angle + gap / 2, angle + sweep - gap / 2, seg.color);
      angle += sweep;
    }
  }
  doc.setFillColor(...C.white);
  doc.circle(cx, cy, rInner, "F");
}

/** Sparkline with soft area fill and a dot on the last point. */
export function drawSparkline(doc: jsPDF, x: number, y: number, w: number, h: number, values: number[], color: RGB): void {
  if (values.length < 2) return;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const pts: [number, number][] = values.map((v, i) => [x + i * step, y + h - (v / max) * h]);
  fillPoly(doc, [...pts, [x + w, y + h], [x, y + h]], C.blueSoft);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  for (let i = 1; i < pts.length; i++) {
    doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  const last = pts[pts.length - 1];
  doc.setFillColor(...color);
  doc.circle(last[0], last[1], 0.9, "F");
}

/* ─── Legend swatch ─── */

export function drawSwatch(doc: jsPDF, x: number, y: number, color: RGB): void {
  doc.setFillColor(...color);
  doc.roundedRect(x, y - 2.4, 2.8, 2.8, 0.6, 0.6, "F");
}
