import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const products = await Product.find({}).sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, category, price, images, stock, isActive } = body;

  if (!name || !description || price === undefined || price === null) {
    return NextResponse.json(
      { error: "Name, description, and price are required" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const product = await Product.create({
    name,
    description,
    category: category || "other",
    price,
    images: images || [],
    stock: stock ?? 0,
    isActive: isActive ?? true,
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
