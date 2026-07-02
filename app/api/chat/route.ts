import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return new Response("GEMINI_API_KEY is not configured", { status: 500 });
  }

  const { messages } = (await request.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages?.length) {
    return new Response("No messages provided", { status: 400 });
  }

  // Fetch approved campsites for context
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
- Be concise and use bullet points for lists.
- If asked about a campsite not in the list, suggest similar available ones.`;

  // Separate history from the last user message
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastUserMessage = messages[messages.length - 1].content;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
  });

  const chat = model.startChat({ history });

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastUserMessage);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
        controller.enqueue(
          new TextEncoder().encode(
            "Sorry, something went wrong. Please try again."
          )
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
