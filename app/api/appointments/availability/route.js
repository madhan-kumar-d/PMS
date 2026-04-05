import prisma from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import { OFFLINE_HOURS, WORKING_HOURS } from "@/lib/constants";

async function getAvailability(req) {
  const { searchParams } = new URL(req.url);
  const doctorId = parseInt(searchParams.get("doctor_id"));
  const dateStr = searchParams.get("date"); // YYYY-MM-DD

  if (!doctorId || !dateStr) {
    return NextResponse.json(
      { message: "Missing doctor_id or date" },
      { status: 400 },
    );
  }

  try {
    const doctor = await prisma.doctors.findUnique({
      where: { id: doctorId },
      select: { time_for_apmt: true },
    });

    if (!doctor) {
      return NextResponse.json({ message: "Doctor not found" }, { status: 404 });
    }

    const apmtDuration = doctor.time_for_apmt || 15;
    
    // Normalize date to UTC midnight to match how it's stored in Postgres @db.Date
    const date = new Date(dateStr + "T00:00:00Z");

    // Fetch existing appointments for the doctor on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        apmt_date: date,
        status: {
          notIn: ["CANCELED"],
        },
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // Helper to format time to "HH:mm"
    const formatTime = (date) => {
      // Use UTC here because our logic stores times as 1970-01-01T...Z
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC"
      });
    };

    // Helper to convert "HH:mm" to minutes from midnight
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const slots = [];
    const startMinutes = WORKING_HOURS.start * 60;
    const endMinutes = WORKING_HOURS.end * 60;
    const offlineStart = OFFLINE_HOURS.start * 60;
    const offlineEnd = OFFLINE_HOURS.end * 60;

    const now = new Date();
    // Compare dates in UTC to be safe
    const isToday = date.getUTCFullYear() === now.getUTCFullYear() && 
                    date.getUTCMonth() === now.getUTCMonth() && 
                    date.getUTCDate() === now.getUTCDate();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    for (let m = startMinutes; m + apmtDuration <= endMinutes; m += apmtDuration) {
      // Check if slot falls in offline hours
      if (m < offlineEnd && m + apmtDuration > offlineStart) {
        continue;
      }

      // Check if slot is in the past
      if (isToday && m <= currentMinutes) {
        continue;
      }

      const slotStartStr = `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
      const slotEndStr = `${Math.floor((m + apmtDuration) / 60).toString().padStart(2, "0")}:${((m + apmtDuration) % 60).toString().padStart(2, "0")}`;

      // Check for overlap with existing appointments
      const isOverlapping = existingAppointments.some((apmt) => {
        // ALWAYS use UTC to avoid server timezone issues
        const apmtStart = apmt.start_time.getUTCHours() * 60 + apmt.start_time.getUTCMinutes();
        const apmtEnd = apmt.end_time.getUTCHours() * 60 + apmt.end_time.getUTCMinutes();

        return m < apmtEnd && m + apmtDuration > apmtStart;
      });

      if (!isOverlapping) {
        slots.push({
          start: slotStartStr,
          end: slotEndStr,
        });
      }
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Fetch availability error:", error);
    return NextResponse.json(
      { message: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getAvailability, ["admin", "supeAdmin", "doctor", "patient"]);
