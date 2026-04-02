import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();

        const { id } = await params;
        const campsite = await CampingSite.findById(id);

        if (!campsite) {
            return NextResponse.json(
                { success: false, message: "Campsite not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: campsite
        })
    } catch (error) {
        console.error("GET /api/campsites/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch campsite" },
            { status: 500 }
        );
    }
}