import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectToDatabase } from "@/lib/mongodb";

import User from "@/models/User";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const user = await User.findById(authUser.id).populate(
    "savedSites",
    "name wilaya region images pricePerNight type",
  );

  return NextResponse.json({ success: true, data: user?.savedSites ?? [] });
}
