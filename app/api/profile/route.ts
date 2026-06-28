import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );

    await connectToDatabase();
    const user = await User.findById(authUser.id).select("-password -mobileToken -mobileTokenExpiry");

    if (!user) return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
    );

    return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );

    const { fullName, phone, city, dateOfBirth, avatar } = await req.json();

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
        authUser.id,
        { fullName, phone, city, dateOfBirth, avatar },
        { new: true }
    ).select("-password -mobileToken -mobileTokenExpiry");

    return NextResponse.json(user);
}
