import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";
import CampingSite from "@/models/CampingSite";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const now = new Date();

  // Auto-cancel pending bookings whose check-in has passed
  await Booking.updateMany(
    {
      user: session.user.id,
      status: "pending",
      checkIn: { $lt: now },
    },
    { status: "cancelled" },
  );

  // Auto-complete any confirmed bookings whose checkout has passed
  await Booking.updateMany(
    {
      user: session.user.id,
      status: "confirmed",
      checkOut: { $lt: now },
    },
    { status: "completed" },
  );

  const bookings = await Booking.find({ user: session.user.id })
    .populate("site", "name wilaya region images pricePerNight type")
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, checkIn, checkOut, guests } = await req.json();

  if (!siteId || !checkIn || !checkOut || !guests) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 },
    );
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const site = await CampingSite.findById(siteId);
  if (!site)
    return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

  // Capacity conflict check
  const overlapping = await Booking.find({
    site: siteId,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  if (overlapping.length > 0) {
    const guestsPerDay: Record<string, number> = {};
    for (const b of overlapping) {
      const cursor = new Date(b.checkIn);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(b.checkOut);
      end.setHours(0, 0, 0, 0);
      while (cursor < end) {
        const key = cursor.toISOString().slice(0, 10);
        guestsPerDay[key] = (guestsPerDay[key] ?? 0) + b.guests;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const reqStart = new Date(checkInDate);
    reqStart.setHours(0, 0, 0, 0);
    const reqEnd = new Date(checkOutDate);
    reqEnd.setHours(0, 0, 0, 0);

    const cursor = new Date(reqStart);
    while (cursor < reqEnd) {
      const key = cursor.toISOString().slice(0, 10);
      const alreadyBooked = guestsPerDay[key] ?? 0;
      if (alreadyBooked + guests > site.capacity) {
        return NextResponse.json(
          { error: "Not enough capacity for the selected dates" },
          { status: 409 },
        );
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
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
