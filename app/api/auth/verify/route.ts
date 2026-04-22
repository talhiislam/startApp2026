import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code)
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 },
      );

    await connectToDatabase();

    const record = await VerificationCode.findOne({ email, code });

    if (!record)
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    await User.findByIdAndUpdate({ email }, { isVerified: true });
    await VerificationCode.deleteMany({ email });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
