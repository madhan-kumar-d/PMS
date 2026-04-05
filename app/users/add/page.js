"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, memo } from "react";

// Memoized Specialization Selection Component
const SpecializationSelect = memo(({ value, onChange, onFirstLoad }) => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSpecs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/specializations");
        const data = await res.json();
        if (res.ok) {
          setSpecializations(data);
          if (data.length > 0 && !value) {
            onFirstLoad(String(data[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch specializations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecs();
  }, []); // Only once on mount

  return (
    <select
      name="specialization_id"
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
    >
      {specializations.map((spec) => (
        <option key={spec.id} value={spec.id}>
          {spec.code} - {spec.description}
        </option>
      ))}
      {loading && <option value="">Loading specializations...</option>}
      {!loading && specializations.length === 0 && (
        <option value="">No specializations available</option>
      )}
    </select>
  );
});

export default function AddUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_no: "",
    dob: "",
    gender: "M",
    specialization_id: "",
    description: "",
    fees: "50",
    time_for_apmt: "15",
    blood_type: "A+",
    allergies: "",
    password: "",
    confirmPassword: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSpecializationLoad = useCallback((id) => {
    setFormData(prev => ({ ...prev, specialization_id: id }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const validateStep = (step) => {
    setError("");
    if (step === 1) {
      if (
        !formData.first_name ||
        !formData.last_name ||
        !formData.email ||
        !formData.phone_no ||
        !formData.dob
      ) {
        setError("Please fill in all basic information fields");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return false;
      }
      const phoneRegex = /^\d{1,10}$/;
      if (!phoneRegex.test(formData.phone_no)) {
        setError("Invalid phone format. Max 10 digits are allowed");
        return false;
      }

      // Age validation for Doctor
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (selectedRole === "doctor" && age < 23) {
        setError("Doctors must be at least 23 years old");
        return false;
      }
      if (birthDate > today) {
        setError("Date of birth cannot be in the future");
        return false;
      }
    } else if (step === 2) {
      if (selectedRole === "doctor") {
        if (!formData.specialization_id || !formData.description || !formData.time_for_apmt) {
          setError("Please provide specialization, description, and appointment time");
          return false;
        }
      } else if (selectedRole === "patient") {
        if (!formData.blood_type) {
          setError("Please select a blood type");
          return false;
        }
      }
    } else if (step === 3) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Password fields are required");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }
      const complexityRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!complexityRegex.test(formData.password)) {
        setError(
          "Password must contain uppercase, lowercase, number, and special character",
        );
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);

    const payload = {
      ...formData,
      name: `${formData.first_name} ${formData.last_name}`,
      role: selectedRole,
      specialization_id: parseInt(formData.specialization_id) || 1,
      fees: parseFloat(formData.fees) || 0,
      time_for_apmt: parseInt(formData.time_for_apmt) || 15,
      allergies: formData.allergies
        ? formData.allergies.split(",").map((a) => a.trim())
        : [],
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Basic Info", icon: "👤" },
    { id: 2, name: "Role Details", icon: "📋" },
    { id: 3, name: "Security", icon: "🔐" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR (Copy of Dashboard Sidebar for consistency) */}
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
            href="/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-blue-700 text-white"
          >
            👥 Users
          </a>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">
            Clinical
          </p>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            🧑‍⚕️ Patients
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            👨‍⚕️ Doctors
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
              Add New User
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-blue-700">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Register New User
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Set up a new account for a medical professional, patient, or
              administrator.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-10">
            {/* Step Progress Sidebar */}
            <div className="col-span-3">
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-4 group">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm transition-all duration-300 ${
                        currentStep >= step.id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-400"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-bold uppercase tracking-widest ${
                          currentStep === step.id
                            ? "text-blue-600"
                            : "text-slate-400"
                        }`}
                      >
                        Step 0{step.id}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          currentStep === step.id
                            ? "text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Area */}
            <div className="col-span-9 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8">
                {error && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm font-semibold">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center gap-2 text-green-700 animate-in zoom-in-95">
                    <span className="text-4xl mb-2">🎉</span>
                    <p className="text-lg font-bold">
                      User created successfully!
                    </p>
                    <p className="text-sm">Redirecting to dashboard...</p>
                  </div>
                )}

                {/* STEP 1: Basic Info & Role Selection */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Account Role & Identity
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mb-10">
                        {["doctor", "patient", "admin"].map((role) =>
                          role === "admin" &&
                          session?.user?.role !== "supeAdmin" ? null : (
                            <div
                              key={role}
                              onClick={() => setSelectedRole(role)}
                              className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center gap-3 ${
                                selectedRole === role
                                  ? "border-blue-600 bg-blue-50/50 shadow-md scale-[1.02]"
                                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-3xl">
                                {role === "doctor"
                                  ? "👨‍⚕️"
                                  : role === "patient"
                                    ? "🧑"
                                    : "🛡️"}
                              </div>
                              <span
                                className={`text-sm font-bold uppercase tracking-wider ${selectedRole === role ? "text-blue-700" : "text-slate-500"}`}
                              >
                                {role}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="e.g. John"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="e.g. Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="name@hospital.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone_no"
                            value={formData.phone_no}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                            <option value="PNTS">Prefer not to say</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Role Details */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      {selectedRole === "doctor"
                        ? "Professional Background"
                        : "Medical Information"}
                    </h3>

                    {selectedRole === "doctor" && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Specialization
                          </label>
                          <SpecializationSelect 
                            value={formData.specialization_id} 
                            onChange={handleInputChange} 
                            onFirstLoad={handleSpecializationLoad}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Consultation Fees ($)
                          </label>
                          <input
                            type="number"
                            name="fees"
                            value={formData.fees}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Time for Appointment (mins)
                          </label>
                          <input
                            type="number"
                            name="time_for_apmt"
                            value={formData.time_for_apmt}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="15"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Professional Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="Bio and experience..."
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {selectedRole === "patient" && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Blood Type
                          </label>
                          <select
                            name="blood_type"
                            value={formData.blood_type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                          >
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                            Known Allergies (Comma separated)
                          </label>
                          <input
                            type="text"
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                            placeholder="e.g. Peanuts, Latex, Aspirin"
                          />
                        </div>
                      </div>
                    )}

                    {selectedRole === "admin" && (
                      <div className="p-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                        <p className="text-slate-500 font-medium">
                          Standard administrative access will be granted for
                          this account.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Security & Submit */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                      Security Credentials
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                          Account Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                        >
                          <option value="active">
                            Active (Immediate Access)
                          </option>
                          <option value="pending">Pending Validation</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentStep === 1 || loading || success}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    currentStep === 1
                      ? "opacity-0 invisible"
                      : "text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  ← Back
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 transition"
                  >
                    Cancel
                  </button>
                  {currentStep < 3 ? (
                    <button
                      onClick={() => {
                        if (validateStep(currentStep)) {
                          setCurrentStep((prev) => prev + 1);
                        }
                      }}
                      className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading || success}
                      className="px-10 py-2.5 bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-all active:scale-95 disabled:bg-blue-400"
                    >
                      {loading
                        ? "Registering..."
                        : success
                          ? "✓ Complete"
                          : "Create Account"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
