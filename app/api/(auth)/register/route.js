import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth, canCreate } from "@/lib/withAuth";

const baseSchema = z.object({
  name: z.string().min(1),
  email: z.string().check(z.email()),
  phone_no: z.string().min(7),
  role: z.enum(["admin", "doctor", "patient"]),
});

const doctorSchema = baseSchema.extend({
  specialization_id: z.number().int().positive(),
  description: z.string().min(1),
  fees: z.number().optional(),
  time_for_apmt: z.number().int().optional(),
});

const patientSchema = baseSchema.extend({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dob: z.string().date(),
  gender: z.enum(["M", "F", "O", "PNTS"]),
  blood_type: z.string().min(1),
  allergies: z.array(z.string()).optional().default([]),
});

async function handler(req) {
  const body = await req.json();
  const { role: targetRole } = body;

  if (!["admin", "doctor", "patient"].includes(targetRole)) {
    return Response.json({ message: "Invalid role" }, { status: 400 });
  }

  const callerRole = req.user.role;
  if (!canCreate(callerRole, targetRole)) {
    return Response.json(
      {
        message:
          targetRole === "admin"
            ? "Only superAdmin can create an admin"
            : "Only admin or superAdmin can create doctor/patient",
      },
      { status: 403 }
    );
  }

  // --- Zod validation per role ---
  const schema =
    targetRole === "doctor"
      ? doctorSchema
      : targetRole === "patient"
      ? patientSchema
      : baseSchema;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Validation failed", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // --- Create user then role-specific record in a transaction ---
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        name: data.name,
        email: data.email,
        phone_no: data.phone_no,
        role: targetRole,
        createdby: req.user.id,
      },
    });

    if (targetRole === "doctor") {
      await tx.doctors.create({
        data: {
          user_id: user.id,
          name: data.name,
          description: data.description,
          specialization_id: data.specialization_id,
          fees: data.fees,
          time_for_apmt: data.time_for_apmt ?? 15,
          createdby: req.user.id,
        },
      });
    } else if (targetRole === "patient") {
      await tx.patients.create({
        data: {
          user_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          dob: new Date(data.dob),
          gender: data.gender,
          blood_type: data.blood_type,
          allergies: data.allergies,
          createdby: req.user.id,
        },
      });
    }

    return user;
  });

  return Response.json({ message: "User created successfully", userId: result.id }, { status: 201 });
}

// withAuth checks role permissions; middleware.js validates bearer token
export const POST = withAuth(handler, ["admin", "supeAdmin"]);
