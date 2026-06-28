import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { connectToDatabase } from "./mongodb";
import User from "@/models/User";
import type { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "camper" | "owner" | "admin";
  avatar?: string;
  image?: string;
}

export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  // Try NextAuth session first (web / cookie-based)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      username: session.user.username ?? "",
      role: session.user.role ?? "camper",
      avatar: session.user.avatar,
      image: session.user.image ?? undefined,
    };
  }

  // Fallback: Bearer token sent by the mobile app
  const authHeader = req?.headers?.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await connectToDatabase();
    const user = await User.findOne({
      mobileToken: token,
      mobileTokenExpiry: { $gt: new Date() },
    }).select("_id email username role avatar");

    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      };
    }
  }

  return null;
}
