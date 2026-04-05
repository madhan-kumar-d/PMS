"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 font-medium animate-pulse">Loading users...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-30 shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">🏥</div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight">MediCare HMS</div>
              <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-3 pb-2">Navigation</p>
          <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all">📊 Dashboard</a>
          <a href="/users" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-extrabold bg-blue-700 text-white shadow-lg shadow-blue-700/20">👥 Users</a>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-6 pb-2">Clinical</p>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all">🧑‍⚕️ Patients</a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all">👨‍⚕️ Doctors</a>
        </nav>
        <div className="p-4 border-t border-white/5 bg-slate-950/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">{session?.user?.name?.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-bold truncate leading-tight">{session?.user?.name}</div>
              <div className="text-slate-500 text-[10px] uppercase font-black">{session?.user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Logout">⏏</button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">Manage and view system users, roles, and profiles.</p>
            </div>
            {(session?.user?.role === "admin" || session?.user?.role === "supeAdmin") && (
              <a 
                href="/users/add" 
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                ➕ Add New User
              </a>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden text-slate-700">
            {error ? (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-bold text-slate-800">Oops! Something went wrong</h3>
                <p className="text-slate-500 mt-1">{error}</p>
                <button onClick={fetchUsers} className="mt-6 px-6 py-2 bg-slate-100 rounded-xl font-bold text-sm hover:bg-slate-200 transition">Try Again</button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-slate-800">No users found</h3>
                <p className="text-slate-500 mt-1">Users you create will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Basic Details</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Access</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Age</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${
                              user.role === 'admin' || user.role === 'supeAdmin' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-bold text-slate-800 tracking-tight">{user.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            user.role === 'admin' || user.role === 'supeAdmin' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            user.role === 'doctor' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5 space-y-1">
                          <div className="text-xs font-bold flex items-center gap-2">
                             <span className="text-slate-300">✉️</span> {user.email}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                             <span className="text-slate-300">📞</span> {user.phone_no}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-slate-600">{calculateAge(user.dob)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</span>
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
