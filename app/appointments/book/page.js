"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center">Loading booking system...</div>
      }
    >
      <BookAppointmentContent />
    </Suspense>
  );
}

function BookAppointmentContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState({
    doctors: false,
    patients: false,
    slots: false,
    submit: false,
    prefill: false,
  });

  const [formData, setFormData] = useState({
    doctor_id: "",
    patient_id: "",
    apmt_date: new Date().toISOString().split("T")[0],
    start_time: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchDoctors = async () => {
    setLoading((prev) => ({ ...prev, doctors: true }));
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      if (res.ok) setDoctors(data);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoading((prev) => ({ ...prev, doctors: false }));
    }
  };

  const fetchPatients = async () => {
    if (session?.user?.role === "patient") return;
    setLoading((prev) => ({ ...prev, patients: true }));
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (res.ok) setPatients(data);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }));
    }
  };

  const fetchAvailability = useCallback(async () => {
    if (!formData.doctor_id || !formData.apmt_date) return;
    setLoading((prev) => ({ ...prev, slots: true }));
    try {
      const res = await fetch(
        `/api/appointments/availability?doctor_id=${formData.doctor_id}&date=${formData.apmt_date}`,
      );
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data);
        setFormData((prev) => ({ ...prev, start_time: "" })); // Reset slot selection
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoading((prev) => ({ ...prev, slots: false }));
    }
  }, [formData.doctor_id, formData.apmt_date]);

  useEffect(() => {
    if (session) {
      fetchDoctors();
      fetchPatients();
    }
  }, [session]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          doctor_id: parseInt(formData.doctor_id),
          patient_id: parseInt(formData.patient_id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-30">
        <div className="p-5 border-b border-slate-800">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
              🏥
            </div>
            <div>
              <div className="text-white font-bold text-sm">MediCare HMS</div>
              <div className="text-slate-400 text-xs">Hospital Management</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1">
            Main
          </p>
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            📊 Dashboard
          </a>
          <a
            href="/appointments"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white"
          >
            📅 Appointments
          </a>
          <a
            href="/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            👥 Users
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                {session.user?.name}
              </div>
              <div className="text-slate-400 text-xs capitalize">
                {session.user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white text-sm"
            >
              ⏏
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* TOPBAR */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span
              className="cursor-pointer hover:text-blue-600 transition"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </span>
            <span>/</span>
            <span className="text-slate-800 font-semibold uppercase tracking-wider">
              Book Appointment
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-blue-700">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-10 max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Schedule Appointment
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Book a new consultation slot for a patient.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center gap-2 text-green-700 animate-in zoom-in-95">
                  <span className="text-4xl mb-2">🎉</span>
                  <p className="text-lg font-bold">
                    Appointment booked successfully!
                  </p>
                  <p className="text-sm">Redirecting to dashboard...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                {/* Doctor Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Select Doctor
                  </label>
                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} ({doc.specialization?.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Selection (For Admin/Doctor) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Select Patient
                  </label>
                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    name="apmt_date"
                    value={formData.apmt_date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                  />
                </div>

                {/* Slot Selection */}
                <div className="col-span-2 space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Available Time Slots
                    {loading.slots && (
                      <span className="ml-2 text-blue-500 animate-pulse">
                        (Refresing...)
                      </span>
                    )}
                  </label>

                  {!formData.doctor_id && (
                    <div className="p-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center text-slate-400">
                      Please select a doctor to see available slots
                    </div>
                  )}

                  {formData.doctor_id &&
                    availableSlots.length === 0 &&
                    !loading.slots && (
                      <div className="p-10 bg-red-50 rounded-2xl border border-red-100 border-dashed text-center text-red-400 font-medium">
                        No slots available for this date.
                      </div>
                    )}

                  {availableSlots.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot.start}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              start_time: slot.start,
                            }))
                          }
                          className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                            formData.start_time === slot.start
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-md"
                              : "border-slate-100 hover:border-slate-200 text-slate-600"
                          }`}
                        >
                          {slot.start}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading.submit || !formData.start_time}
                  className="px-10 py-3 bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading.submit ? "Booking..." : "Confirm Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
