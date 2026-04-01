import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { Types } from "mongoose";

import User from "@/models/User";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized"}, { status: 401 });

    await connectToDatabase();
    
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid campsite id" }, { status: 400 });
    }

    const user = await User.findOne({ username: session.user.username });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const alreadySaved = user.savedSites.some((s) => s.toString() === id);

    if (alreadySaved) {
        user.savedSites = user.savedSites.filter((s) => s.toString() !== id);
    } else {
        user.savedSites.push(new Types.ObjectId(id));
    }

    await user.save();

    return NextResponse.json({
        success: true,
        saved: !alreadySaved,
    });
}
