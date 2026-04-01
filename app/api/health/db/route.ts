import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const connection = await connectToDatabase();
    const readyState = connection.connection.readyState;

    return NextResponse.json(
      {
        success: true,
        status: readyState === 1 ? "connected" : "connecting",
        database: connection.connection.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/health/db error:", error);

    return NextResponse.json(
      {
        success: false,
        status: "disconnected",
      },
      { status: 500 }
    );
  }
}
