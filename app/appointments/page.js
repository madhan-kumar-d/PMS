"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppointmentListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (res.ok) {
        setAppointments(data);
      } else {
        throw new Error(data.message || "Failed to fetch appointments");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this appointment as ${status.toLowerCase()}?`)) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchAppointments(); // Refresh list
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update status");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  useEffect(() => {
    if (session) {
      fetchAppointments();
    }
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-700 border-green-200";
      case "PENDING": return "bg-blue-100 text-blue-700 border-blue-200";
      case "COMPLETED": return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatTime = (dateStr) => {
    // Our times are stored as 1970-01-01T...Z
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC"
    });
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
              Appointments List
            </span>
          </div>
          <div className="flex gap-4 items-center">
             <button 
                onClick={fetchAppointments}
                className="p-2 text-slate-400 hover:text-blue-600 transition"
                title="Refresh"
             >
                🔄
             </button>
             <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
               {session.user?.name?.charAt(0).toUpperCase()}
             </div>
          </div>
        </div>

        <div className="p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Appointments
              </h1>
              <p className="text-slate-500 mt-2 text-lg">
                Manage and track clinical schedules.
              </p>
            </div>
            <a
              href="/appointments/book"
              className="px-6 py-3 bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-all active:scale-95"
            >
              + New Appointment
            </a>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            {loading ? (
              <div className="p-20 text-center text-slate-400 font-medium animate-pulse">
                Fetching appointment data...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-bold text-slate-800">No appointments found</h3>
                <p className="text-slate-500 mt-1">Start by booking a new appointment.</p>
                <a
                  href="/appointments/book"
                  className="inline-block mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
                >
                  Book Now
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                      {(session.user.role === "admin" || session.user.role === "supeAdmin") && (
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                      )}
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.map((apmt) => (
                      <tr key={apmt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                              {apmt.patients.first_name[0]}{apmt.patients.last_name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">
                                {apmt.patients.first_name} {apmt.patients.last_name}
                              </div>
                              <div className="text-xs text-slate-400">ID: #{apmt.patient_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">
                            {new Date(apmt.apmt_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {formatTime(apmt.start_time)} - {formatTime(apmt.end_time)}
                          </div>
                        </td>
                        {(session.user.role === "admin" || session.user.role === "supeAdmin") && (
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700">Dr. {apmt.doctors.name}</div>
                            <div className="text-xs text-slate-400 capitalize">{apmt.doctors.specialization?.code}</div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${getStatusColor(apmt.status)}`}>
                            {apmt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {apmt.status === "PENDING" && (
                                <button 
                                  onClick={() => handleUpdateStatus(apmt.id, "CONFIRMED")}
                                  className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition shadow-sm border border-green-100"
                                  title="Confirm Appointment"
                                >
                                  ✓
                                </button>
                             )}
                             {(apmt.status === "PENDING" || apmt.status === "CONFIRMED") && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateStatus(apmt.id, "COMPLETED")}
                                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100"
                                    title="Mark as Completed"
                                  >
                                    📋
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(apmt.id, "CANCELED")}
                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </>
                             )}
                             {(apmt.status === "COMPLETED" || apmt.status === "CANCELED") && (
                                <span className="text-xs text-slate-300 italic px-4 font-medium uppercase tracking-tight">Closed Record</span>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
