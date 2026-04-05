import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

async function getDoctors(req) {
  try {
    const doctors = await prisma.doctors.findMany({
      include: {
        specialization: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Fetch doctors error:", error);
    return NextResponse.json(
      { message: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getDoctors, ["admin", "supeAdmin", "doctor", "patient"]);
