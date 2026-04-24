import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";
import type { PipelineStage, SortOrder } from "mongoose";

const PAGE_SIZE = 12;

const sortOptions: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  rating: { averageRating: -1 },
  price_asc: { pricePerNight: 1 },
  price_desc: { pricePerNight: -1 },
};

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);

    const region = searchParams.get("region");
    const wilaya = searchParams.get("wilaya");
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") ?? "newest";

    const pageParam = searchParams.get("page");
    const skipPagination = pageParam === "all";
    const page = skipPagination ? 1 : Math.max(1, parseInt(pageParam ?? "1", 10));
    const skip = (page - 1) * PAGE_SIZE;

    // ── Atlas Search path ──────────────────────────────────────────────────
    if (search) {
      // Optional filter clauses (region / wilaya / type)
      const filterClauses: object[] = [];
      if (region)
        filterClauses.push({ text: { query: region, path: "region" } });
      if (wilaya)
        filterClauses.push({ text: { query: wilaya, path: "wilaya" } });
      if (type) filterClauses.push({ text: { query: type, path: "type" } });

      const searchStage: PipelineStage = {
        $search: {
          index: "campsite_search",
          compound: {
            must: [
              {
                compound: {
                  should: [
                    // Prefix matching for short queries like "tas"
                    {
                      autocomplete: {
                        query: search,
                        path: "name",
                        score: { boost: { value: 6 } },
                      },
                    },
                    {
                      autocomplete: {
                        query: search,
                        path: "wilaya",
                        score: { boost: { value: 4 } },
                      },
                    },
                    // Boost exact-ish name matches
                    {
                      text: {
                        query: search,
                        path: "name",
                        score: { boost: { value: 4 } },
                        fuzzy: { maxEdits: 1 },
                      },
                    },
                    // Wilaya match
                    {
                      text: {
                        query: search,
                        path: "wilaya",
                        score: { boost: { value: 3 } },
                        fuzzy: { maxEdits: 1 },
                      },
                    },
                    // Region match
                    {
                      text: {
                        query: search,
                        path: "region",
                        score: { boost: { value: 2 } },
                      },
                    },
                    // Description / amenities - lower boost
                    {
                      text: {
                        query: search,
                        path: ["description", "amenities"],
                        fuzzy: { maxEdits: 1 },
                      },
                    },
                  ],
                  minimumShouldMatch: 1,
                },
              },
            ],
            filter: [
              { equals: { path: "isApproved", value: true } },
              ...filterClauses,
            ],
          },
        },
      };

      const priceMatchStage: PipelineStage[] =
        minPrice || maxPrice
          ? [
              {
                $match: {
                  pricePerNight: {
                    ...(minPrice ? { $gte: Number(minPrice) } : {}),
                    ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
                  },
                },
              } as PipelineStage,
            ]
          : [];

      const sortStage: PipelineStage[] =
        sort === "newest"
          ? [
              {
                $addFields: { _score: { $meta: "searchScore" } },
              } as PipelineStage,
              { $sort: { _score: -1 } } as PipelineStage,
            ]
          : [
              {
                $sort: sortOptions[sort] ?? sortOptions.newest,
              } as PipelineStage,
            ];

      if (skipPagination) {
        const pipeline: PipelineStage[] = [searchStage, ...priceMatchStage, ...sortStage];
        const campsites = await CampingSite.aggregate(pipeline);
        return NextResponse.json({ success: true, data: campsites, total: campsites.length, page: 1, totalPages: 1 });
      }

      const pipeline: PipelineStage[] = [
        searchStage,
        ...priceMatchStage,
        ...sortStage,
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: PAGE_SIZE }],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await CampingSite.aggregate(pipeline);
      const total: number = result?.totalCount?.[0]?.count ?? 0;
      return NextResponse.json({
        success: true,
        data: result?.data ?? [],
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      });
    }

    // ── Regular filter path (no search term) ──────────────────────────────
    interface CampsiteFilter {
      isApproved: boolean;
      region?: string;
      wilaya?: string;
      type?: string;
      pricePerNight?: { $gte?: number; $lte?: number };
    }

    const filter: CampsiteFilter = { isApproved: true };
    if (region) filter.region = region;
    if (wilaya) filter.wilaya = wilaya;
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    const sortQuery = sortOptions[sort] ?? sortOptions.newest;
    
    if (skipPagination) {
      const campsites = await CampingSite.find(filter).sort(sortQuery);
      return NextResponse.json({ success: true, data: campsites, total: campsites.length, page: 1, totalPages: 1 });
    }

    const [campsites, total] = await Promise.all([
      CampingSite.find(filter).sort(sortQuery).skip(skip).limit(PAGE_SIZE),
      CampingSite.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: campsites,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("GET /api/campsites error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch campsites" },
      { status: 500 },
    );
  }
}