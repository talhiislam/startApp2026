import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );

    const { currentPassword, newPassword } = await req.json();

    await connectToDatabase();
    const user = await User.findOne({ username: session.user.username });

    if (!user || !user.password) {
        return NextResponse.json(
            { error: "No password set on this account" },
            { status: 400 }
        );   
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return NextResponse.json(
            { error: "Currebt password is incorrect" },
            { status: 400 }
        );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
        { username: session.user.username },
        { password: hashed }
    );

    return NextResponse.json({ message: "Password updated successfully" });
}