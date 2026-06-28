import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { sendCampsiteRejectedEmail } from "@/lib/email";

import User from "@/models/User";
import CampingSite from "@/models/CampingSite";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const { id } = await params;

  const campsite = await CampingSite.findByIdAndUpdate(
    id,
    { isApproved: false },
    { new: true },
  );

  if (!campsite)
    return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

  // Notify owner
  try {
    const owner = await User.findById(campsite.owner).select("email username");
    if (owner) {
      await sendCampsiteRejectedEmail(
        owner.email,
        owner.username,
        campsite.name,
      );
    }
  } catch (emailError) {
    console.error("Failed to send campsite rejected email:", emailError);
  }
  return NextResponse.json({ success: true, data: campsite });
}
