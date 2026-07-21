import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: buildSystemPrompt(),
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number }).statusCode ??
      (error as { status?: number }).status;

    const msg = String((error as Error).message ?? "").toLowerCase();
    const isRateLimit =
      statusCode === 429 ||
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("resource exhausted") ||
      msg.includes("too many requests");

    if (isRateLimit) {
      return Response.json(
        {
          action: "chat",
          message:
            "Maaf, aku sedang menerima terlalu banyak permintaan. Coba lagi dalam beberapa saat ya! 🙏",
        },
        { status: 429 }
      );
    }

    console.error("Finny AI error:", error);
    return Response.json(
      { error: "Gagal terhubung ke Finny. Coba lagi ya!" },
      { status: 500 }
    );
  }
}
