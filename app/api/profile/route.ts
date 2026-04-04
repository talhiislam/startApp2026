import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );
    
    await connectToDatabase();
    const user = await User.findById(session.user.id).select("-password");

    if (!user) return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
    );

    // Backfill avatar from auth session (e.g. Google picture) if DB is missing it.
    const sessionAvatar = session.user.avatar || session.user.image;
    if (!user.avatar && sessionAvatar) {
        user.avatar = sessionAvatar;
        await user.save();
    }

    return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );

    const { fullName, phone, city, dateOfBirth } = await req.json();

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
        session.user.id,
        { fullName, phone, city, dateOfBirth },
        { new: true }
    ).select("-password");

    return NextResponse.json(user);
}
