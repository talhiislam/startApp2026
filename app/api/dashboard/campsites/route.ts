import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import CampingSite from "@/models/CampingSite";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "owner" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const campsites = await CampingSite.find({ owner: session.user.id }).sort({
    createdAt: -1,
  });

  return NextResponse.json({ success: true, data: campsites });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "owner" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    description,
    wilaya,
    region,
    type,
    pricePerNight,
    capacity,
    amenities,
    images,
    coordinates,
  } = body;

  if (!name || !description || !wilaya || !region || !type || !pricePerNight) {
    return NextResponse.json(
      { error: "All required fields must be filled" },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const campsite = await CampingSite.create({
    name,
    description,
    wilaya,
    region,
    type,
    pricePerNight: Number(pricePerNight),
    capacity: capacity ? Number(capacity) : 10,
    amenities: amenities ?? [],
    images: images ?? [],
    coordinates: coordinates ?? { lat: 0, lng: 0 },
    owner: session.user.id,
    isApproved: false,
  });

  return NextResponse.json({ success: true, data: campsite }, { status: 201 });
}
