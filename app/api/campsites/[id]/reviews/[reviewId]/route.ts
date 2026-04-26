import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import Review from "@/models/Review";
import CampingSite from "@/models/CampingSite";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const { id, reviewId } = await params;

  const review = await Review.findById(reviewId);
  if (!review)
    return NextResponse.json({ error: "Review not found" }, { status: 404 });

  if (review.user.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Review.findByIdAndDelete(reviewId);

  // Recalculate averageRating and reviewCount
  const remaining = await Review.find({
    targetId: id,
    targetType: "CampingSite",
  });
  const reviewCount = remaining.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : Math.round(
          (remaining.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
        ) / 10;

  await CampingSite.findByIdAndUpdate(id, { reviewCount, averageRating });

  return NextResponse.json({ success: true });
}
