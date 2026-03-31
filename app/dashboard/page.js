'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-30">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏥</div>
            <div>
              <div className="text-white font-bold text-sm">MediCare HMS</div>
              <div className="text-slate-400 text-xs">Hospital Management</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1">Main</p>
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white">📊 Dashboard</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">📅 Appointments <span className="ml-auto text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">5</span></a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">👥 Users</a>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">Clinical</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">🧑‍⚕️ Patients</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">👨‍⚕️ Doctors</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">🏨 Wards & Beds</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">💊 Pharmacy</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">🧪 Lab Results</a>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">Administration</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">💰 Billing</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">📈 Reports</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition">⚙️ Settings</a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{session.user?.name}</div>
              <div className="text-slate-400 text-xs capitalize">{session.user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white text-sm"
              title="Logout"
            >
              ⏏
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ml-64 flex-1 min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800">Dashboard</div>
            <div className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search patients, doctors…"
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-500 w-56"
              />
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-base">
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">✉️</button>
            <div className="relative" id="userMenuWrap">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-blue-700"
              >
                {session.user?.name?.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg min-w-48 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-800">{session.user?.name}</div>
                    <div className="text-xs text-slate-400">{session.user?.email}</div>
                  </div>
                  <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 block">👤 My Profile</a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 block">⚙️ Settings</a>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Good morning, {session.user?.name?.split(' ')[0]} 👋</h2>
              <p className="text-slate-500 text-sm mt-1">Here's what's happening at the hospital today.</p>
            </div>
            <div className="flex gap-2">
              <a href="#" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition">📅 New Appointment</a>
              <a href="#" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition">➕ Add User</a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <a href="#" className="bg-white rounded-xl border border-slate-200 p-5 text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition block">
              <div className="text-2xl mb-2">🧑‍⚕️</div>
              <div className="text-xs font-bold text-slate-700">Register Patient</div>
            </a>
            <a href="#" className="bg-white rounded-xl border border-slate-200 p-5 text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition block">
              <div className="text-2xl mb-2">👨‍⚕️</div>
              <div className="text-xs font-bold text-slate-700">Add Doctor</div>
            </a>
            <a href="#" className="bg-white rounded-xl border border-slate-200 p-5 text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition block">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-xs font-bold text-slate-700">Book Appointment</div>
            </a>
            <a href="#" className="bg-white rounded-xl border border-slate-200 p-5 text-center cursor-pointer hover:border-blue-500 hover:shadow-md transition block">
              <div className="text-2xl mb-2">🧪</div>
              <div className="text-xs font-bold text-slate-700">Lab Orders</div>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">🧑‍⚕️</div>
              <div>
                <div className="text-2xl font-extrabold text-slate-800">1,248</div>
                <div className="text-xs text-slate-500">Total Patients</div>
                <div className="text-xs text-green-600 font-semibold mt-1">▲ 12% this month</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">👨‍⚕️</div>
              <div>
                <div className="text-2xl font-extrabold text-slate-800">64</div>
                <div className="text-xs text-slate-500">Active Doctors</div>
                <div className="text-xs text-green-600 font-semibold mt-1">▲ 3 new this week</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">📅</div>
              <div>
                <div className="text-2xl font-extrabold text-slate-800">38</div>
                <div className="text-xs text-slate-500">Today's Appointments</div>
                <div className="text-xs text-red-500 font-semibold mt-1">▼ 4 cancelled</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">🏥</div>
              <div>
                <div className="text-2xl font-extrabold text-slate-800">142</div>
                <div className="text-xs text-slate-500">Admitted Patients</div>
                <div className="text-xs text-green-600 font-semibold mt-1">▲ 87% bed occupancy</div>
              </div>
            </div>
          </div>

          {/* Placeholder for future content */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Today's Appointments</h3>
              <p className="text-slate-500 text-sm">Appointments will be displayed here</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Doctors on Duty</h3>
              <p className="text-slate-500 text-sm">Active doctors list will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
