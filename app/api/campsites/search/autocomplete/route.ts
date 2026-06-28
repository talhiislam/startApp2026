import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";
import type { PipelineStage } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    await connectToDatabase();

    const pipeline: PipelineStage[] = [
      {
        $search: {
          index: "campsite_search",
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "name",
                  score: { boost: { value: 3 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "wilaya",
                  score: { boost: { value: 2 } },
                },
              },
            ],
            minimumShouldMatch: 1,
            filter: [{ equals: { path: "isApproved", value: true } }],
          },
        },
      },
      { $limit: 6 },
      {
        $project: {
          _id: 1,
          name: 1,
          wilaya: 1,
          region: 1,
          type: 1,
          images: { $slice: ["$images", 1] },
          score: { $meta: "searchScore" },
        },
      },
    ];

    let results;
    try {
      results = await CampingSite.aggregate(pipeline);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const missingAtlasSearch =
        message.includes("Unrecognized pipeline stage name: '$search'") ||
        message.toLowerCase().includes("index not found");

      // Fallback for local MongoDB or missing Atlas search index.
      if (!missingAtlasSearch) throw error;

      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      results = await CampingSite.find({
        isApproved: true,
        $or: [{ name: regex }, { wilaya: regex }],
      })
        .select({ _id: 1, name: 1, wilaya: 1, region: 1, type: 1, images: 1 })
        .limit(6)
        .lean();
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("GET /api/campsites/search/autocomplete error:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
