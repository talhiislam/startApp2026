import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import CampingSite from "@/models/CampingSite";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "owner" && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const campsite = await CampingSite.findById(id);
    if (!campsite) return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

    if (campsite.owner.toString() !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
        name, description, wilaya, region,
        type, pricePerNight, capacity, amenities, images, coordinates,
    } = body;

    const updated = await CampingSite.findByIdAndUpdate(
        id,
        {
            name,
            description,
            wilaya,
            region,
            type,
            pricePerNight: Number(pricePerNight),
            capacity: capacity ? Number(capacity) : campsite.capacity,
            amenities,
            images,
            coordinates,
            // Reset approval when edited so admin reviews again
            isApproved: false,
        },
        { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "owner" && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const campsite = await CampingSite.findById(id);
    if (!campsite) return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

    if (campsite.owner.toString() !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await CampingSite.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Campsite deleted" });
}