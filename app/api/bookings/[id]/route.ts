import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { id } = await params;

    const booking = await Booking.findOne({ _id: id, user: session.user.id});
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be cancelled" }, { status: 400});
    }

    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json({ success: true, message: "Booking cancelled" });
}