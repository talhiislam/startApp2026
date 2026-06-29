import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user)
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 },
      );

    if (user.isVerified)
      return NextResponse.json(
        { error: "This account is already verified" },
        { status: 400 },
      );

    // Delete any existing codes for this email
    await VerificationCode.deleteMany({ email });

    // Generate new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await VerificationCode.create({ email, code, expiresAt });

    try {
      await sendVerificationEmail(email, code);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Code was created — client can still verify; don't surface email failures as 500
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/resend-code error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
