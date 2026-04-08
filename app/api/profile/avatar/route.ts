import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select("avatar");

    const avatarUrl =
        user?.avatar || session.user.avatar || session.user.image || "";

    if (!avatarUrl) {
        return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    try {
        const upstream = await fetch(avatarUrl, {
            headers: {
                Accept: "image/*",
            },
            cache: "no-store",
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: "Unable to load avatar" },
                { status: upstream.status },
            );
        }

        const contentType =
            upstream.headers.get("content-type") || "image/jpeg";
        const buffer = await upstream.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=300",
            },
        });
    } catch {
        return NextResponse.json(
            { error: "Unable to fetch avatar" },
            { status: 502 },
        );
    }
}
