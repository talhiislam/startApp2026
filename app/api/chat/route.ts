import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("GEMINI_API_KEY not set", { status: 500 });
  }

  const { messages } = (await request.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages?.length) {
    return new Response("No messages", { status: 400 });
  }

  // Fetch campsites for context
  let campsiteContext = "";
  try {
    await connectToDatabase();
    const campsites = await CampingSite.find({ isApproved: true })
      .select("name wilaya region type pricePerNight amenities capacity averageRating")
      .limit(30)
      .lean();

    if (campsites.length > 0) {
      campsiteContext =
        "Available campsites on SahaTour:\n" +
        campsites
          .map((c) => {
            const amenities = (c.amenities as string[]).slice(0, 4).join(", ");
            const rating =
              (c.averageRating as number) > 0
                ? `, rated ${(c.averageRating as number).toFixed(1)}/5`
                : "";
            return `• ${c.name} — ${c.wilaya} (${c.region}), ${c.type}, ${c.pricePerNight} DZD/night${amenities ? `, amenities: ${amenities}` : ""}${rating}`;
          })
          .join("\n");
    }
  } catch {
    // Continue without DB context
  }

  const systemInstruction = `You are SahaTour AI, a friendly camping assistant for Algeria. Help users find campsites and plan outdoor trips.

${campsiteContext}

Rules:
- Reply in the SAME language the user uses (Arabic, French, English, or Algerian Darija).
- Recommend specific campsites from the list above when relevant.
- Give practical camping tips: weather, gear, safety, best seasons by region.
- Be concise and use bullet points for lists.`;

  // Build Gemini-format contents
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Call Gemini REST API directly (works with any key format)
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });
  } catch (err) {
    console.error("Gemini fetch error:", err);
    return new Response("Failed to reach Gemini API", { status: 502 });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error("Gemini API error:", geminiRes.status, errText);
    return new Response(`Gemini error ${geminiRes.status}: ${errText}`, {
      status: 502,
    });
  }

  // Stream SSE chunks → extract text → forward as plain text
  const readableStream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]" || !jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                }>;
              };
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        console.error("Stream read error:", err);
        controller.enqueue(
          new TextEncoder().encode("Sorry, something went wrong. Please try again.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
