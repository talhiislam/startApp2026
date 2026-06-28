import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { sendCampsiteApprovedEmail } from "@/lib/email";

import CampingSite from "@/models/CampingSite";
import User from "@/models/User";

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
    { isApproved: true },
    { new: true },
  );

  if (!campsite)
    return NextResponse.json({ error: "Campsite not found" }, { status: 404 });

  // Notify owner
  try {
    const owner = await User.findById(campsite.owner).select("email username");
    if (owner) {
      await sendCampsiteApprovedEmail(
        owner.email,
        owner.username,
        campsite.name,
        campsite._id.toString(),
      );
    }
  } catch (emailError) {
    console.error("Failed to send campsite approved email:", emailError);
  }
  return NextResponse.json({ success: true, data: campsite });
}
