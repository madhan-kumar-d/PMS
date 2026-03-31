-- CreateEnum
CREATE TYPE "apmt_status" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'NO-SHOW', 'IN-PRGRESS', 'CANCELED', 'RE-SCHEDULED');

-- CreateEnum
CREATE TYPE "doc_type" AS ENUM ('LAB', 'SCAN', 'PRESCEIPTION');

-- CreateEnum
CREATE TYPE "gender_type" AS ENUM ('M', 'F', 'O', 'PNTS');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('supeAdmin', 'admin', 'doctor', 'patient');

-- CreateTable
CREATE TABLE "appointment" (
    "id" SERIAL NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "apmt_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "apmt_status" NOT NULL DEFAULT 'PENDING',
    "createdby" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" INTEGER,
    "updatedat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_status" (
    "id" SERIAL NOT NULL,
    "apmt_id" INTEGER NOT NULL,
    "status" "apmt_status" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdby" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "specialization_id" INTEGER NOT NULL,
    "time_for_apmt" INTEGER NOT NULL DEFAULT 15,
    "fees" DECIMAL(10,3),
    "createdby" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" INTEGER,
    "updatedat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_scan" (
    "id" SERIAL NOT NULL,
    "apmt_id" INTEGER NOT NULL,
    "document_type" "doc_type" NOT NULL,
    "documents" TEXT,
    "createdby" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "gender_type" NOT NULL,
    "blood_type" VARCHAR(10) NOT NULL,
    "allergies" TEXT[],
    "createdby" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" INTEGER,
    "updatedat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialization" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "description" TEXT,

    CONSTRAINT "specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(20) NOT NULL,
    "role" "user_role" DEFAULT 'patient',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "createdby" INTEGER NOT NULL,
    "modifiedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "modifiedby" INTEGER,
    "password" VARCHAR NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialization_code_key" ON "specialization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_no_key" ON "users"("phone_no");

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_updatedby_fkey" FOREIGN KEY ("updatedby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_status" ADD CONSTRAINT "appointment_status_apmt_id_fkey" FOREIGN KEY ("apmt_id") REFERENCES "appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_status" ADD CONSTRAINT "appointment_status_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "specialization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_updatedby_fkey" FOREIGN KEY ("updatedby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_scan" ADD CONSTRAINT "lab_scan_apmt_id_fkey" FOREIGN KEY ("apmt_id") REFERENCES "appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_scan" ADD CONSTRAINT "lab_scan_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_updatedby_fkey" FOREIGN KEY ("updatedby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_modifiedby_fkey" FOREIGN KEY ("modifiedby") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
