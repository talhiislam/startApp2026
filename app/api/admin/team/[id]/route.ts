import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function getIdFromUrl(req: NextRequest) {
  return req.nextUrl.pathname.split("/").pop() ?? "";
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = getIdFromUrl(req);
  const body = await req.json();
  const { initials, name, role, email, order } = body;

  await connectToDatabase();
  const member = await TeamMember.findByIdAndUpdate(
    id,
    { initials, name, role, email, order },
    { new: true, runValidators: true }
  );

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: member });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = getIdFromUrl(req);
  await connectToDatabase();
  const member = await TeamMember.findByIdAndDelete(id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
