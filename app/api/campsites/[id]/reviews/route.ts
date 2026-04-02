import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Review from "@/models/Review";
import CampingSite from "@/models/CampingSite";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }>}
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const reviews = await Review.find({ targetId: id, targetType: "CampingSite" })
            .populate("user", "username avatar")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: reviews });
    } catch (error) {
        console.error("GET /api/campsites/[id]/reviews error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );

        await connectToDatabase();
        const { id } = await params;

        // Check campsite exists
        const campsite = await CampingSite.findById(id);
        if (!campsite) return NextResponse.json(
            { error: "Campsite not found" },
            { status: 404 }
        );

        // One review per user per campsite
        const existing = await Review.findOne({
            user: session.user.id,
            targetId: id,
            targetType: "CampingSite",
        });
        if (existing) return NextResponse.json(
            { error: "you have already reviewed this campsite" },
            { status: 400 }
        );

        const { rating, comment } = await req.json();

        if (!rating || rating < 1 || rating > 5) return NextResponse.json(
            { error: "Rating must be between 1 and 5" },
            { status: 400 }
        );

        // Create review
        const review = await Review.create({
            user: session.user.id,
            targetId: id,
            targetType: "CampingSite",
            rating,
            comment,
        });

        // Recalculate averageRating and reviewCount
        const allReviews = await Review.find({ targetId: id, targetType: "CampingSite" });
        const reviewCount = allReviews.length;
        const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

        await CampingSite.findByIdAndUpdate(id, {
            reviewCount,
            averageRating: Math.round(averageRating * 10) / 10,
        });

        // Return populated review
        const populated = await review.populate("user", "username avatar");

        return NextResponse.json(
            { success: true, data: populated },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/campsites/[id]/reviews error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit review" },
            { status: 500 }
        );
    }
}