import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        return NextResponse.redirect(new URL("/auth/login", req.url));   
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/profile/:path*", "/trips/:path*", "/dashboard/:path*", "/admin/:path*", "/support/:path*"],
};
