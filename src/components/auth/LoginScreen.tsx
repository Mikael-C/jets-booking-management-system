"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { UserRole } from "@/types/aviation";
import { Shield, Plane, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginScreen() {
  const { login } = useAviation();
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("ops.director@orbelo.com");
  const [password, setPassword] = useState("••••••••••••");

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("admin@orbelo.com");
    } else {
      setEmail("agent@orbelo.com");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      selectedRole,
      email,
      selectedRole === "admin" ? "Capt. Alexander Vance" : "Marcus Vance"
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C9A052] selection:text-[#0F1420]">
      {/* Top Header Logo */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0F1420] border border-[#C9A052]/40 flex items-center justify-center shadow-md">
            <Plane className="w-5 h-5 text-[#C9A052] transform -rotate-45" />
          </div>
          <span
            className="font-display text-3xl font-black tracking-tight"
            style={{ color: "#FF6B00", letterSpacing: "-0.03em" }}
          >
            Orbelo
          </span>
          <span className="text-xs uppercase tracking-widest font-mono text-[#0F1420]/60 font-bold border-l border-[#0F1420]/20 pl-3">
            Aviation Management
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
          
          {/* Subtle gold accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C9A052]" />

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#0F1420] tracking-tight">
              Executive Portal Login
            </h2>
            <p className="text-xs text-[#0F1420]/60 mt-1">
              Select your role to access private charter operations & quoting desk
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                selectedRole === "admin"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("agent")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                selectedRole === "agent"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Charter Agent</span>
            </button>
          </div>

          {/* Role Description Card */}
          <div className="p-3 rounded-xl bg-[#F5F2EC]/80 border border-[#E0DAD0] text-[11px] text-[#0F1420]/75 mb-6 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#C9A052] flex-shrink-0 mt-0.5" />
            <div>
              {selectedRole === "admin" ? (
                <p>
                  <strong className="text-[#0F1420]">Full Operations Authority:</strong> View all bookings, generate official quotes, invoices & briefs, fulfill agent requests, and manage fleet & dispatch.
                </p>
              ) : (
                <p>
                  <strong className="text-[#0F1420]">Broker Quoting Desk:</strong> Request quotes, invoices, and flight briefs directly from admin operations and track deal status.
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1420]/80 mb-1.5 font-mono">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#0F1420]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F1420] placeholder-[#0F1420]/40 focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1420]/80 mb-1.5 font-mono">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#0F1420]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F1420] placeholder-[#0F1420]/40 focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052] transition-colors"
                />
              </div>
            </div>

            {/* Primary Gold Login Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Log In as {selectedRole === "admin" ? "Administrator" : "Agent"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo One-Click Access Buttons */}
          <div className="mt-6 pt-5 border-t border-[#E0DAD0] space-y-2">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-center text-[#0F1420]/50 font-bold">
              Instant One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => login("admin", "admin@orbelo.com", "Capt. Alexander Vance")}
                className="py-2 px-3 rounded-lg bg-[#0F1420] hover:bg-[#1A2338] text-white text-[11px] font-bold transition-all border border-[#0F1420] flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3 h-3 text-[#C9A052]" />
                <span>Admin Demo</span>
              </button>

              <button
                type="button"
                onClick={() => login("agent", "agent@orbelo.com", "Marcus Vance")}
                className="py-2 px-3 rounded-lg bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-[11px] font-bold transition-all border border-[#D1C9BC] flex items-center justify-center gap-1.5"
              >
                <Plane className="w-3 h-3 text-[#C9A052]" />
                <span>Agent Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="text-center text-xs text-[#0F1420]/60 pb-2">
        <p className="font-mono text-[11px]">
          OPS Dispatch v2.4 • EASA Part-CAT & Austrian Civil Aviation Compliant
        </p>
      </div>
    </div>
  );
}
