import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

async function createAppointment(req) {
  try {
    const { doctor_id, patient_id, apmt_date, start_time } = await req.json();

    if (!doctor_id || !patient_id || !apmt_date || !start_time) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const doctor = await prisma.doctors.findUnique({
      where: { id: doctor_id },
      select: { time_for_apmt: true },
    });

    if (!doctor) {
      return NextResponse.json({ message: "Doctor not found" }, { status: 404 });
    }

    const apmtDuration = doctor.time_for_apmt || 15;
    
    // Normalize date to UTC midnight to match how it's stored in Postgres @db.Date
    const date = new Date(apmt_date + "T00:00:00Z");

    // Calculate end_time
    const [hours, minutes] = start_time.split(":").map(Number);
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + apmtDuration;
    
    const end_time = `${Math.floor(endTotalMinutes / 60).toString().padStart(2, "0")}:${(endTotalMinutes % 60).toString().padStart(2, "0")}`;

    // Convert start_time and end_time strings to Date objects for Prisma @db.Time(6)
    // Prisma usually expects a full Date object and extracts the time part for postgres 'time' type
    const dummyDate = "1970-01-01T";
    const startTimeDate = new Date(`${dummyDate}${start_time}:00Z`);
    const endTimeDate = new Date(`${dummyDate}${end_time}:00Z`);

    // Check for overlap again (race condition prevention)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctor_id,
        apmt_date: date,
        status: {
          notIn: ["CANCELED"],
        },
      },
    });

    const isOverlapping = existingAppointments.some((apmt) => {
      const existingStart = apmt.start_time.getUTCHours() * 60 + apmt.start_time.getUTCMinutes();
      const existingEnd = apmt.end_time.getUTCHours() * 60 + apmt.end_time.getUTCMinutes();
      return startTotalMinutes < existingEnd && endTotalMinutes > existingStart;
    });

    if (isOverlapping) {
      return NextResponse.json(
        { message: "This slot is already booked" },
        { status: 409 },
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctor_id,
        patient_id,
        apmt_date: date,
        start_time: startTimeDate,
        end_time: endTimeDate,
        status: "PENDING",
        createdby: parseInt(req.user.id),
      },
    });

    // Also create initial status record
    await prisma.appointment_status.create({
      data: {
        apmt_id: appointment.id,
        status: "PENDING",
        description: "Appointment created",
        createdby: parseInt(req.user.id),
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { message: "Failed to create appointment" },
      { status: 500 },
    );
  }
}

async function getAppointments(req) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const doctorIdParam = searchParams.get("doctor_id");
  const role = req.user.role;
  const userId = parseInt(req.user.id);

  try {
    let whereClause = {};

    if (role === "doctor") {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: userId },
      });
      if (!doctor) {
        return NextResponse.json(
          { message: "Doctor profile not found" },
          { status: 403 },
        );
      }
      whereClause.doctor_id = doctor.id;
    } else if (doctorIdParam) {
      whereClause.doctor_id = parseInt(doctorIdParam);
    }

    if (dateStr) {
      whereClause.apmt_date = new Date(dateStr + "T00:00:00Z");
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patients: true,
        doctors: {
          include: {
            specialization: true,
          },
        },
      },
      orderBy: [
        { apmt_date: "desc" },
        { start_time: "desc" },
      ],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(createAppointment, ["admin", "supeAdmin", "doctor"]);
export const GET = withAuth(getAppointments, ["admin", "supeAdmin", "doctor"]);
