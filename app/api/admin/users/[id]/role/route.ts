import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role } = await req.json();

    if (!["camper", "owner", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectToDatabase();
    const { id } = await params;

    const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
    ).select("-password");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
}