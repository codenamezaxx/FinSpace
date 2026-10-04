import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { buildScanPrompt } from "@/lib/ai/scan-prompt";
import { parseScanResponse } from "@/lib/ai/scan-parse";

// Vision calls can take a while — allow up to 60s where the platform permits.
export const maxDuration = 60;

// ~6.5MB binary. Larger payloads time out downstream; the client downscales
// captures, so this is only a backstop with a friendly message.
const MAX_IMAGE_CHARS = 9_000_000;

export async function POST(req: Request) {
  let language: string | undefined;

  try {
    const body = await req.json();
    language = body.language;
    const { image, pockets } = body;

    if (!image || typeof image !== "string") {
      return Response.json({ error: "image (dataUrl) is required" }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Finny scan error: GOOGLE_GENERATIVE_AI_API_KEY is not set");
      return Response.json({
        error: language === "en"
          ? "AI service is not configured. Please contact support!"
          : "Layanan AI belum dikonfigurasi. Hubungi admin ya!",
      }, { status: 500 });
    }

    if (image.length > MAX_IMAGE_CHARS) {
      return Response.json({
        action: "chat",
        message: language === "en"
          ? "This photo is too large to process. Please try a smaller photo!"
          : "Fotonya terlalu besar untuk diproses. Coba foto yang lebih kecil ya!",
        confidence: "low",
      });
    }

    const pocketNames = Array.isArray(pockets) && pockets.length > 0
      ? pockets.map((p: { name?: string }) => p.name ?? "").filter(Boolean)
      : [];

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      // Deterministic output: same receipt → same JSON, less prose drift
      temperature: 0,
      system: buildScanPrompt(pocketNames.length > 0 ? pocketNames : undefined, language),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: language === "en" ? "Analyze this receipt/payment proof:" : "Analisis struk/bukti pembayaran ini:" },
            { type: "image", image },
          ],
        },
      ],
    });

    const text = result.text;
    // Balanced-brace candidate scan (longest first): tolerates prose,
    // fences, stray braces and multiple objects in the model output
    const parsed = parseScanResponse(text);

    if (!parsed) {
      console.error(
        "Finny scan: model output contained no parseable action JSON:",
        text.slice(0, 2000)
      );
      return Response.json({
        action: "chat",
        message: language === "en"
          ? "Sorry, I couldn't read this receipt clearly. Please try with a clearer photo!"
          : "Maaf, aku tidak bisa membaca struk ini dengan jelas. Coba foto yang lebih jelas ya!",
        confidence: "low",
      });
    }

    return Response.json(parsed);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? (error as { status?: number }).status;
    const msg = String((error as Error).message ?? "").toLowerCase();
    const isRateLimit = statusCode === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("resource exhausted") || msg.includes("too many requests");

    if (isRateLimit) {
      return Response.json({
        action: "chat",
        message: language === "en"
          ? "Sorry, I'm receiving too many requests right now. Please try again in a moment! 🙏"
          : "Maaf, aku sedang menerima terlalu banyak permintaan. Coba lagi dalam beberapa saat ya! 🙏",
      }, { status: 429 });
    }

    console.error("Finny scan error:", error);
    return Response.json({
      error: language === "en"
        ? "Failed to process receipt. Please try again!"
        : "Gagal memproses struk. Coba lagi ya!",
    }, { status: 500 });
  }
}
