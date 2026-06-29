import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const password = body.password;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingEmail = await User.findOne({ email });
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

    // If no email service is configured, auto-verify the account (dev mode)
    const hasEmailService = !!process.env.RESEND_API_KEY;

    await User.create({
      email,
      username,
      password: hashedPassword,
      role: "camper",
      isVerified: !hasEmailService, // auto-verify if no email service
    });

    // Generate and store verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await VerificationCode.deleteMany({ email });
    await VerificationCode.create({ email, code, expiresAt });

    let emailSent = true;

    if (!hasEmailService) {
      // Dev mode: print code to console, skip email sending
      console.log(`\n========================================`);
      console.log(`📧 [DEV MODE] Verification code for ${email}: ${code}`);
      console.log(`   Account auto-verified (no email service configured)`);
      console.log(`========================================\n`);
      emailSent = false;
    } else {
      // Production mode: send verification email
      try {
        await sendVerificationEmail(email, code);
      } catch (emailError) {
        emailSent = false;
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      autoVerified: !hasEmailService,
      message: hasEmailService
        ? "Account created. Please verify your email."
        : "Account created successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
