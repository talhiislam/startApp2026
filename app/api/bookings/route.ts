import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";
import CampingSite from "@/models/CampingSite";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized"}, { status: 401 });

    await connectToDatabase();
    const bookings = await Booking.find({ user: session.user.id })
        .populate("site", "name wilaya region images pricePerNight type")
        .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { siteId, checkIn, checkOut, guests } = await req.json();

    if (!siteId || !checkIn || !checkOut || !guests ) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
        return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    await connectToDatabase();
    
    const site = await CampingSite.findById(siteId);
    if (!site) return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

    const nights = Math.round(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * site.pricePerNight;

    const booking = await Booking.create({
        user: session.user.id,
        site: siteId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
        status: "pending",
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
}