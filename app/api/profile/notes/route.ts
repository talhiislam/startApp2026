import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    await connectToDatabase();
    const user = await User.findById(session.user.id).select("notes");
    if (!user) return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
    );

    return NextResponse.json({ success: true, data: user.notes ?? "" });
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { notes } = await req.json();

    if(typeof notes !== "string") return NextResponse.json(
        { error: "Invalid notes value" },
        { status: 400 }
    );

    await connectToDatabase();
    await User.findByIdAndUpdate(session.user.id, { notes });
    
    return NextResponse.json({ success: true } )
}