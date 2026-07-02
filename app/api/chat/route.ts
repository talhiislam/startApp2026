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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `You are SahaTour AI, a friendly camping assistant for Algeria. Help users discover great campsites and plan outdoor trips across Algeria.

Guidelines:
- Always reply in the SAME language the user writes in (Arabic, French, English, or Algerian Darija).
- Give practical tips: best camping regions, gear recommendations, safety, best seasons.
- Be warm, concise, and use bullet points for lists.
- Mention Algerian regions like Sahara, Kabylie, Hoggar, Coastal when relevant.`,
            },
          ],
        },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(`[Gemini ${geminiRes.status}]: ${errText}`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Buffer incomplete SSE lines across chunks, then forward text
    let buffer = "";
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";           // keep last incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json) as {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
              }>;
            };
            const part = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (part) controller.enqueue(encoder.encode(part));
          } catch { /* skip */ }
        }
      },
      flush(controller) {
        // process any leftover bytes
        if (buffer.startsWith("data: ")) {
          const json = buffer.slice(6).trim();
          try {
            const parsed = JSON.parse(json) as {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
              }>;
            };
            const part = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (part) controller.enqueue(encoder.encode(part));
          } catch { /* skip */ }
        }
      },
    });

    geminiRes.body!.pipeTo(writable).catch(() => {});

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Server error: ${msg}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
