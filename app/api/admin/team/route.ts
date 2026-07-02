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

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  await connectToDatabase();
  const members = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ success: true, data: members });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { initials, name, role, email, order } = body;

  if (!initials || !name || !role || !email)
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });

  await connectToDatabase();
  const member = await TeamMember.create({ initials, name, role, email, order: order ?? 0 });
  return NextResponse.json({ success: true, data: member }, { status: 201 });
}
