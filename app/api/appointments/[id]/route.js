import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

// Fetch single appointment (for pre-filling reschedule form)
async function getAppointment(req, { params }) {
  const { id } = await params;
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patients: true,
        doctors: {
          include: { specialization: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Fetch appointment error:", error);
    return NextResponse.json(
      { message: "Failed to fetch appointment" },
      { status: 500 },
    );
  }
}

// Update appointment (Status, Reschedule)
async function updateAppointment(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const { status, apmt_date, start_time } = body;
  const userId = parseInt(req.user.id);

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }

    // Role-based permission (Admin or assigned Doctor)
    if (req.user.role === "doctor") {
       const doctor = await prisma.doctors.findFirst({
         where: { user_id: userId }
       });
       if (!doctor || doctor.id !== existing.doctor_id) {
         return NextResponse.json({ message: "Forbidden: Not your appointment" }, { status: 403 });
       }
    }

    let updateData = {};
    if (status) updateData.status = status;

    // Rescheduling Logic
    if (apmt_date && start_time) {
      const doctor = await prisma.doctors.findUnique({
        where: { id: existing.doctor_id },
        select: { time_for_apmt: true },
      });

      const apmtDuration = doctor.time_for_apmt || 15;
      const normalizedDate = new Date(apmt_date + "T00:00:00Z");

      // Calculate end_time
      const [hours, minutes] = start_time.split(":").map(Number);
      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes = startTotalMinutes + apmtDuration;
      const end_time = `${Math.floor(endTotalMinutes / 60).toString().padStart(2, "0")}:${(endTotalMinutes % 60).toString().padStart(2, "0")}`;

      const dummyDate = "1970-01-01T";
      const startTimeDate = new Date(`${dummyDate}${start_time}:00Z`);
      const endTimeDate = new Date(`${dummyDate}${end_time}:00Z`);

      // Overlap check (exclude current appointment)
      const otherAppointments = await prisma.appointment.findMany({
        where: {
          doctor_id: existing.doctor_id,
          apmt_date: normalizedDate,
          id: { not: parseInt(id) },
          status: { notIn: ["CANCELED"] },
        },
      });

      const isOverlapping = otherAppointments.some((apmt) => {
        const apmtStart = apmt.start_time.getUTCHours() * 60 + apmt.start_time.getUTCMinutes();
        const apmtEnd = apmt.end_time.getUTCHours() * 60 + apmt.end_time.getUTCMinutes();
        return startTotalMinutes < apmtEnd && endTotalMinutes > apmtStart;
      });

      if (isOverlapping) {
        return NextResponse.json({ message: "Requested slot is already booked" }, { status: 409 });
      }

      updateData.apmt_date = normalizedDate;
      updateData.start_time = startTimeDate;
      updateData.end_time = endTimeDate;
      updateData.status = "RE_SCHEDULED";
    }

    const updated = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updatedby: userId,
        updatedat: new Date(),
      },
    });

    // Create status history
    await prisma.appointment_status.create({
      data: {
        apmt_id: updated.id,
        status: updateData.status || existing.status,
        description: apmt_date ? "Appointment rescheduled" : `Status updated to ${status}`,
        createdby: userId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { message: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getAppointment, ["admin", "supeAdmin", "doctor"]);
export const PATCH = withAuth(updateAppointment, ["admin", "supeAdmin", "doctor"]);
