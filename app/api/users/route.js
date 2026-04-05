import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

async function getUserList(req) {
  const callerRole = req.user?.role;

  try {
    let users;
    if (callerRole === "admin" || callerRole === "supeAdmin") {
      users = await prisma.users.findMany({
        include: {
          patients_patients_user_idTousers: {
            select: { dob: true },
          },
          doctors_doctors_user_idTousers: {
            select: { specialization: true },
          },
        },
        orderBy: { createdat: "desc" },
      });
    } else if (callerRole === "doctor") {
      users = await prisma.users.findMany({
        where: { role: "patient" },
        include: {
          patients_patients_user_idTousers: {
            select: { dob: true },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone_no: u.phone_no,
      role: u.role,
      dob: u.patients_patients_user_idTousers?.[0]?.dob || null,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getUserList, ["admin", "supeAdmin", "doctor"]);
