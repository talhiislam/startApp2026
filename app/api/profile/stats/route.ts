import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";
import User from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    await connectToDatabase();

    const [bookings, user] = await Promise.all([
        Booking.find({ user: session.user.id }),
        User.findOne({ username: session.user.username }).select("savedSites"),
    ]);

    const tripsPlanned = bookings.length;
    const tripsCompleted = bookings.filter((b) => b.status === "completed").length;
    const campsitesSaved = user?.savedSites?.length ?? 0;

    return NextResponse.json({
        success: true,
        data: { tripsPlanned, tripsCompleted, campsitesSaved },
    });
}