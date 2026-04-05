import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const specializations = await prisma.specialization.findMany({
      orderBy: { code: "asc" }
    });
    return NextResponse.json(specializations);
  } catch (error) {
    console.error("Fetch specializations error:", error);
    return NextResponse.json(
      { message: "Failed to fetch specializations" },
      { status: 500 }
    );
  }
}
