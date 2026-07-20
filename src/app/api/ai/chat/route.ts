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
    console.error("Finny AI error:", error);
    return Response.json(
      { error: "Gagal terhubung ke Finny. Coba lagi ya!" },
      { status: 500 }
    );
  }
}
