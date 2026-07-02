import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    const body = await request.json() as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };
    const messages = body.messages ?? [];
    if (!messages.length) {
      return new Response("No messages", { status: 400 });
    }

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Non-streaming first to verify connectivity
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "You are SahaTour AI, a camping assistant for Algeria. Reply in the same language the user writes in." }],
        },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    const responseText = await geminiRes.text();

    if (!geminiRes.ok) {
      return new Response(`[Gemini ${geminiRes.status}]: ${responseText}`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    let answer = "No answer";
    try {
      const parsed = JSON.parse(responseText) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      answer = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "Empty response";
    } catch {
      answer = `Parse error: ${responseText}`;
    }

    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Server error: ${msg}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
