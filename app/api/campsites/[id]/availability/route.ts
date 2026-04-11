import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";
import Booking from "@/models/Booking";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);

        const year = parseInt(searchParams.get("year") ?? "");
        const month = parseInt(searchParams.get("month") ?? ""); // 0-indexed (JS Date convention)

        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
            return NextResponse.json(
                { error: "Valid year and month (0-11) are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const campsite = await CampingSite.findById(id).select("capacity");

        if (!campsite) {
            return NextResponse.json(
                { error: "Campsite not found" },
                { status: 404 }
            );
        }

        const capacity = campsite.capacity ?? 10;

        // First and last day of the requested month
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1); // exclusive

        // Fetch all active bookings that overlap this month at all
        const bookings = await Booking.find({
            site: id,
            status: { $in: ["pending", "confirmed"] },
            checkIn: { $lt: monthEnd },
            checkOut: { $gt: monthStart },
        }).select("checkIn checkOut guests");

        // Build a guests-per-day map for every day in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const guestsPerDay: Record<string, number> = {};

        for (const booking of bookings) {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);

            // Iterate each night of the booking (checkOut night is not occupied)
            const cursor = new Date(Math.max(checkIn.getTime(), monthStart.getTime()));
            const end = new Date(Math.min(checkOut.getTime(), monthEnd.getTime()));

            while (cursor < end) {
                // Only count days within this month
                if (cursor.getMonth() === month && cursor.getFullYear() === year) {
                    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
                    guestsPerDay[key] = (guestsPerDay[key] ?? 0) + booking.guests;
                }
                cursor.setDate(cursor.getDate() + 1);
            }
        }

        // Convert to status map — only include days that have at least some bookings
        const result: Record<string, { booked: number; status: "partial" | "full"}> = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const booked = guestsPerDay[key] ?? 0;
            if (booked > 0) {
                result[key] = {
                    booked,
                    status: booked >= capacity ? "full" : "partial",
                };
            }
        }
        return NextResponse.json({ success: true, data: result, capacity});
    } catch (error) {
        console.error("GET /api/campsites/[id]/availability error:", error);
        return NextResponse.json(
            { error: "Failed to fetch availability" },
            { status: 500 }
        );
    }
}