import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";
import CampingSite from "@/models/CampingSite";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["confirmed", "canceled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectToDatabase();

  const booking = await Booking.findById(id).populate("site");
  if (!booking)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Verify the booking belongs to one of the owner's campsites
  const site = await CampingSite.findById(booking.site);
  if (!site || site.owner.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  booking.status = status;
  await booking.save();

  return NextResponse.json({ success: true, data: booking });
}
