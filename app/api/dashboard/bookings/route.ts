import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Booking from "@/models/Booking";
import CampingSite from "@/models/CampingSite";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "owner" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  // Get all campsites owned by this user
  const ownedSites = await CampingSite.find(
    { owner: session.user.id },
    { _id: 1 },
  );
  const ownedSiteIds = ownedSites.map((s) => s._id);

  // Get all bookings for those campsites
  const bookings = await Booking.find({ site: { $in: ownedSiteIds } })
    .populate("user", "username avatar")
    .populate("site", "name")
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: bookings });
}
