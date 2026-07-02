import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const { messages } = await request.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
  }

  // Fetch approved campsites to give the AI real context
  let campsiteContext = "";
  try {
    await connectToDatabase();
    const campsites = await CampingSite.find({ isApproved: true })
      .select("name wilaya region type pricePerNight description amenities capacity averageRating")
      .limit(30)
      .lean();

    if (campsites.length > 0) {
      campsiteContext = campsites.map((c) => {
        const amenityList = (c.amenities as string[]).slice(0, 4).join(", ");
        return `• ${c.name} — ${c.wilaya} (${c.region}), ${c.type}, ${c.pricePerNight} DZD/night, capacity ${c.capacity}${amenityList ? `, amenities: ${amenityList}` : ""}${c.averageRating > 0 ? `, rating ${(c.averageRating as number).toFixed(1)}/5` : ""}`;
      }).join("\n");
    }
  } catch {
    // Continue without campsite context if DB fails
  }

  const systemPrompt = `You are SahaTour AI, a friendly and knowledgeable camping assistant for Algeria. Your job is to help users discover great camping spots, plan their trips, and learn about camping in Algeria.

${campsiteContext ? `Here are the currently available campsites on SahaTour:\n${campsiteContext}\n` : ""}
Guidelines:
- Always reply in the SAME language the user writes in (Arabic, French, or English). If they write in Darija (Algerian dialect), reply in Darija or Modern Standard Arabic.
- When recommending campsites, reference the real ones listed above by name.
- Give practical tips about camping in Algeria: weather by season and region, gear recommendations, safety advice, what to bring.
- Be warm, enthusiastic about the outdoors, and concise. Use bullet points when listing things.
- If the user asks about a campsite not in our list, acknowledge it and suggest similar ones from the list.
- You can answer questions about: campsite types (tent, bungalow, wild, glamping), Algerian regions (Sahara, Kabylie, Hoggar, Coastal), booking tips, camping gear, and outdoor safety.
- Keep responses focused and helpful — avoid very long answers unless the user asks for detail.`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(
            "\n\nSorry, I encountered an error. Please try again."
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
