import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { connectToDatabase } from "@/lib/mongodb";
import { sendSupportRequestEmail } from "@/lib/email";

import SupportRequest from "@/models/SupportRequest";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, message } = await req.json();

  if (!category || !message?.trim()) {
    return NextResponse.json(
      { error: "Category and message are required" },
      { status: 400 },
    );
  }

  const validCategories = ["bug", "booking", "campsite", "account", "other"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (message.trim().length < 10) {
    return NextResponse.json(
      { error: "Message must be at least 10 characters" },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const request = await SupportRequest.create({
    user: authUser.id,
    category,
    message: message.trim(),
  });

  try {
    const user = await User.findById(authUser.id).select("email username");
    if (user) {
      await sendSupportRequestEmail(
        user.email,
        user.username,
        category,
        message.trim(),
      );
    }
  } catch (emailError) {
    console.error("Failed to send support request email:", emailError);
  }

  return NextResponse.json({ success: true, data: request }, { status: 201 });
}
