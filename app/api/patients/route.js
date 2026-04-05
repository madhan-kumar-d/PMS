import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

async function getPatients(req) {
  try {
    const patients = await prisma.patients.findMany({
      orderBy: { first_name: "asc" },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Fetch patients error:", error);
    return NextResponse.json(
      { message: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getPatients, ["admin", "supeAdmin", "doctor"]);
