import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const user = await User.findOne({ username: session.user.username }).populate(
    "savedSites",
    "name wilaya region images pricePerNight type",
  );

  return NextResponse.json({ success: true, data: user?.savedSites ?? [] });
}
