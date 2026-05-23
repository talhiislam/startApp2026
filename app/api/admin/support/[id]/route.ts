import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { sendSupportResolvedEmail } from "@/lib/email";
import User from "@/models/User";

import SupportRequest from "@/models/SupportRequest";

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

  const request = await SupportRequest.findByIdAndUpdate(
    id,
    { status: "resolved" },
    { new: true },
  );

  if (!request)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const populated = await request.populate<{user: { email: string; username: string } }>("user", "email username");
  
  try {
    await sendSupportResolvedEmail(populated.user.email, populated.user.username, request.category);
  } catch (emailError) {
    console.error("Failed to send support resolved email:", emailError);
  }

  return NextResponse.json({ success: true, data: request });
}
