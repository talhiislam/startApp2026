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

    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: "You are SahaTour AI, a friendly camping assistant for Algeria. Help users find campsites and plan outdoor trips. Always reply in the SAME language the user writes in (Arabic, French, or English).",
            },
          ],
        },
        contents: [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] },
        ],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      // Return error visibly in chat instead of crashing
      return new Response(
        `[Gemini error ${geminiRes.status}]: ${errText}`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // Stream SSE → extract text chunks → forward as plain text
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        for (const line of text.split("\n")) {
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
            if (part) controller.enqueue(new TextEncoder().encode(part));
          } catch {
            /* skip malformed line */
          }
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
