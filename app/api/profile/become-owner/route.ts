import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import User from "@/models/User";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    if (session.user.role !== "camper") return NextResponse.json(
        { error: "Only campers can upgrade to owner" },
        { status: 400 }
    );

    await connectToDatabase();

    await User.findOneAndUpdate(
        { username: session.user.username },
        { role: "owner" }
    );

    return NextResponse.json({ success: true, message: "You are now an owner" });
}