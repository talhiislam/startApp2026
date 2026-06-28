import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { error: "Please verify your email before signing in." },
      { status: 403 },
    );
  }

  const mobileToken = randomBytes(32).toString("hex");
  const mobileTokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);

  await User.findByIdAndUpdate(user._id, { mobileToken, mobileTokenExpiry });

  return NextResponse.json({
    success: true,
    token: mobileToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.fullName || user.username,
      role: user.role,
      avatar: user.avatar ?? null,
    },
  });
}
