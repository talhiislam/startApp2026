import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already in use"},
        { status: 400 }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      role: "camper",
      isVerified: false,
    });

    // Generate and store verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await VerificationCode.create({ email: email.toLowerCase(), code, expiresAt });

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(email.toLowerCase(), code);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please verify you email.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
