/**
 * Robust extraction of the model-produced JSON object from a scan response.
 * Models sometimes wrap JSON in prose/markdown, emit several brace blocks,
 * or include stray braces — so instead of one greedy/non-greedy regex we
 * scan for every balanced top-level `{...}` candidate (longest first) and
 * let the caller try JSON.parse on each until one with a string `action`
 * field succeeds. Exported for unit tests.
 */
export function extractJsonCandidates(text: string): string[] {
  const cleaned = text
    .replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1")
    .trim();
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(cleaned.slice(start, i + 1));
        start = -1;
      } else if (depth < 0) {
        depth = 0;
        start = -1;
      }
    }
  }

  return out.sort((a, b) => b.length - a.length);
}

export interface ParsedScan {
  action: string;
  message?: string;
  data?: Record<string, unknown>;
  missing_fields?: string[];
  confidence?: string;
}

/** First candidate that parses AND carries a string `action`, else null. */
export function parseScanResponse(text: string): ParsedScan | null {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ParsedScan>;
      if (parsed && typeof parsed.action === "string") {
        return parsed as ParsedScan;
      }
    } catch {
      // try the next (shorter) candidate
    }
  }
  return null;
}
