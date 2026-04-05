import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth, canCreate } from "@/lib/withAuth";
import { NextResponse } from "next/server";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number format (e.g. +1234567890)",
  );

const calculateAge = (dobString) => {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone_no: phoneSchema,
  role: z.enum(["admin", "doctor", "patient"]),
});

const doctorSchema = baseSchema.extend({
  specialization_id: z.coerce.number().int().positive("Invalid specialization"),
  description: z.string().min(1, "Description is required"),
  fees: z.coerce.number().optional().default(0),
  time_for_apmt: z.coerce.number().int().optional().default(15),
  dob: z
    .string()
    .date("Invalid date of birth")
    .refine(
      (val) => calculateAge(val) >= 23,
      "Doctors must be at least 23 years old",
    ),
});

const patientSchema = baseSchema.extend({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z
    .string()
    .date("Invalid date of birth")
    .refine(
      (val) => new Date(val) <= new Date(),
      "Date of birth cannot be in the future",
    ),
  gender: z.enum(["M", "F", "O", "PNTS"]),
  blood_type: z.string().min(1, "Blood type is required"),
  allergies: z.array(z.string()).optional().default([]),
});

async function handler(req) {
  const body = await req.json();
  const { role: targetRole } = body;

  const callerRole = req.user?.role;
  if (!callerRole) {
    return NextResponse.json(
      { message: "Role metadata missing" },
      { status: 401 },
    );
  }

  if (!canCreate(callerRole, targetRole)) {
    return NextResponse.json(
      {
        message:
          targetRole === "admin"
            ? "Only superAdmin can create an admin"
            : "Only admin or superAdmin can create doctor/patient",
      },
      { status: 403 },
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
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  const hashedPassword = await bcrypt.hash(data.password, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone_no: data.phone_no,
          role: targetRole,
          is_active: true,
          createdby: Number(req.user.id),
        },
      });

      if (targetRole === "doctor") {
        await tx.doctors.create({
          data: {
            user_id: user.id,
            name: data.name,
            description: data.description,
            specialization_id: Number(data.specialization_id),
            fees: data.fees,
            time_for_apmt: data.time_for_apmt,
            createdby: Number(req.user.id),
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
            createdby: Number(req.user.id),
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.id,
        role: result.role,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("User creation failed:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Email or phone number already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "An error occurred during user creation" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handler, ["admin", "supeAdmin"]);
