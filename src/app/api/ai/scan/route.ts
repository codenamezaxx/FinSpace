import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { buildScanPrompt } from "@/lib/ai/scan-prompt";

export async function POST(req: Request) {
  try {
    const { image, pockets } = await req.json();
    if (!image || typeof image !== "string") {
      return Response.json({ error: "image (dataUrl) is required" }, { status: 400 });
    }

    const pocketNames = Array.isArray(pockets) && pockets.length > 0
      ? pockets.map((p: { name?: string }) => p.name ?? "").filter(Boolean)
      : [];

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: buildScanPrompt(pocketNames.length > 0 ? pocketNames : undefined),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analisis struk/bukti pembayaran ini:" },
            { type: "image", image },
          ],
        },
      ],
    });

    const text = result.text;
    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      // Strip markdown fences first, then try non-greedy first JSON object match
      const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      const match = cleaned.match(/\{[\s\S]*?\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
      } else {
        parsed = null;
      }
    }

    if (!parsed) {
      return Response.json({
        action: "chat", message: "Maaf, aku tidak bisa membaca struk ini dengan jelas. Coba foto yang lebih jelas ya!",
        confidence: "low",
      });
    }

    return Response.json(parsed);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? (error as { status?: number }).status;
    const msg = String((error as Error).message ?? "").toLowerCase();
    const isRateLimit = statusCode === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("resource exhausted") || msg.includes("too many requests");

    if (isRateLimit) {
      return Response.json({ action: "chat", message: "Maaf, aku sedang menerima terlalu banyak permintaan. Coba lagi dalam beberapa saat ya! 🙏" }, { status: 429 });
    }

    console.error("Finny scan error:", error);
    return Response.json({ error: "Gagal memproses struk. Coba lagi ya!" }, { status: 500 });
  }
}
