import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";
import type { SortOrder } from "mongoose";

interface CampsiteFilter {
    isApproved: boolean;
    region?: string;
    wilaya?: string;
    type?: string;
    pricePerNight?: {
        $gte?: number;
        $lte?: number;
    };
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

const sortOptions: Record<string, Record<string, SortOrder>> = {
    newest:     { createdAt: -1 },
    rating:     { averageRating: -1 },
    price_asc:  { pricePerNight: 1 },
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
        const search = searchParams.get("search");
        const sort = searchParams.get("sort") ?? "newest";

        const filter: CampsiteFilter = { isApproved: true};

        if (region) filter.region = region;
        if (wilaya) filter.wilaya = wilaya;
        if (type) filter.type = type;
        if (minPrice || maxPrice) {
            filter.pricePerNight = {};
            if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { wilaya: { $regex: search, $options: "i" } },
                { region: { $regex: search, $options: "i" } },
            ];
        }

        const sortQuery = sortOptions[sort] ?? sortOptions.newest;
        const campsites = await CampingSite.find(filter).sort(sortQuery);
        return NextResponse.json({ success: true, data: campsites });
    } catch (error) {
        console.error("GET /api/campsites error:", error);
        return NextResponse.json(
            { success: false, message: "failed to fetch campsites" },
            { status: 500 }
        );
    }
}
