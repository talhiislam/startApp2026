import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { id } = await params;

    const booking = await Booking.findOne({ _id: id, user: authUser.id });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be cancelled" }, { status: 400 });
    }

    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json({ success: true, message: "Booking cancelled" });
}
