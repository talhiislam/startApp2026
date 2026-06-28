import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectToDatabase } from "@/lib/mongodb";
import { sendPasswordChangedEmail } from "@/lib/email";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
    );

    const { currentPassword, newPassword } = await req.json();

    await connectToDatabase();
    const user = await User.findById(authUser.id);

    if (!user || !user.password) {
        return NextResponse.json(
            { error: "No password set on this account" },
            { status: 400 }
        );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
        );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(authUser.id, { password: hashed });

    try {
        await sendPasswordChangedEmail(user.email, user.username);
    } catch (emailError) {
        console.error("Failed to send password changed email:", emailError);
    }

    return NextResponse.json({ message: "Password updated successfully" });
}
