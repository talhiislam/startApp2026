import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { sendBookingStatusEmail } from "@/lib/email";

import Booking from "@/models/Booking";
import CampingSite from "@/models/CampingSite";
import User from "@/models/User";
import type { ICampingSite } from "@/models/CampingSite";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["confirmed", "cancelled", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectToDatabase();

  // Fetch booking and the campsite in one round-trip
  const booking = await Booking.findById(id);
  if (!booking)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Fetch the site separately to verify ownership
  const site = await CampingSite.findById(booking.site);
  if (!site || site.owner.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  booking.status = status;
  await booking.save();

  // Notify camper
  try {
    const camper = await User.findById(booking.user).select("email username");
    if (camper) {
      await sendBookingStatusEmail(
        camper.email,
        camper.username,
        site.name,
        status,
        new Date(booking.checkIn).toLocaleDateString("en-GB"),
        new Date(booking.checkOut).toLocaleDateString("en-GB"),
      );
    }
  } catch (emailError) {
    console.error("Failed to send booking status email:", emailError);
  }

  return NextResponse.json({ success: true, data: booking });
}
