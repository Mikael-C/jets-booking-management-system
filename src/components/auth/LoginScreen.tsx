"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { UserRole } from "@/types/aviation";
import {
  Shield,
  Plane,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Cog,
  Crown,
  KeyRound,
  Smartphone,
  AlertTriangle,
  RotateCcw,
  X,
  Check
} from "lucide-react";

export default function LoginScreen() {
  const { login } = useAviation();
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("admin@orbelo.com");
  const [password, setPassword] = useState("••••••••••••");

  // USR-1: 2FA State (TOTP mandatory for staff, optional for agents)
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [agent2FaEnabled, setAgent2FaEnabled] = useState(false);

  // USR-5: Password Reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const roleConfigs: {
    role: UserRole;
    label: string;
    email: string;
    name: string;
    icon: React.ReactNode;
    desc: string;
    isStaff: boolean;
  }[] = [
    {
      role: "super_admin",
      label: "Super Admin",
      email: "admin@orbelo.com",
      name: "Maximilian von Bern",
      icon: <Crown className="w-3.5 h-3.5 text-[#C9A052]" />,
      desc: "Full system administration, user provisioning, security audits, financial oversight & global margins.",
      isStaff: true
    },
    {
      role: "admin",
      label: "Admin / Sales",
      email: "admin@orbelo.com",
      name: "Capt. Alexander Vance",
      icon: <Shield className="w-3.5 h-3.5 text-[#C9A052]" />,
      desc: "Full operations authority: review bookings, generate official quotes, fulfill RFQs, and dispatch flights.",
      isStaff: true
    },
    {
      role: "finance",
      label: "Finance",
      email: "finance@orbelo.com",
      name: "Elena Rostova",
      icon: <CreditCard className="w-3.5 h-3.5 text-[#C9A052]" />,
      desc: "Invoice verification, international tax calculations, client wire reconciliations & payment tracking.",
      isStaff: true
    },
    {
      role: "operations",
      label: "Operations",
      email: "ops@orbelo.com",
      name: "David Schneider",
      icon: <Cog className="w-3.5 h-3.5 text-[#C9A052]" />,
      desc: "Flight dispatch, slot/PPR coordination, FBO ground handling ramp management & crew duty validation.",
      isStaff: true
    },
    {
      role: "agent",
      label: "Charter Agent",
      email: "agent@orbelo.com",
      name: "Marcus Vance",
      icon: <Plane className="w-3.5 h-3.5 text-[#C9A052]" />,
      desc: "Broker quoting desk: request charter quotes, track RFQ deal statuses, and review client documents.",
      isStaff: false
    }
  ];

  const currentConfig = roleConfigs.find((r) => r.role === selectedRole) || roleConfigs[1];

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    setStep("credentials");
    setTotpCode("");
    setTotpError("");
    const config = roleConfigs.find((r) => r.role === newRole);
    if (config) {
      setEmail(config.email);
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // USR-1: 2FA is mandatory for staff roles, optional for agents
    if (currentConfig.isStaff || agent2FaEnabled) {
      setStep("2fa");
    } else {
      login(selectedRole, email, currentConfig.name);
    }
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length < 6) {
      setTotpError("Please enter a valid 6-digit authenticator code.");
      return;
    }
    // Accept valid 6-digit TOTP
    login(selectedRole, email, currentConfig.name);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setIsResetOpen(false);
      setResetSent(false);
      setResetEmail("");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C9A052] selection:text-[#0F1420]">
      {/* Top Header Logo */}
      <div className="text-center pt-2">
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
      <div className="max-w-lg w-full mx-auto my-auto">
        <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle gold accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C9A052]" />

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-[#0F1420] tracking-tight">
              Executive Portal Login
            </h2>
            <p className="text-xs text-[#0F1420]/60 mt-1">
              Select your role to access private charter operations, dispatch, finance, or broker quoting
            </p>
          </div>

          {/* Role Selector Tabs (5 Roles) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] mb-5">
            {roleConfigs.map((cfg) => {
              const isSelected = selectedRole === cfg.role;
              return (
                <button
                  key={cfg.role}
                  type="button"
                  onClick={() => handleRoleChange(cfg.role)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    isSelected
                      ? "bg-[#0F1420] text-white shadow-sm"
                      : "text-[#0F1420]/70 hover:text-[#0F1420] hover:bg-white/60"
                  }`}
                >
                  {cfg.icon}
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Description Card with 2FA Indicator */}
          <div className="p-3 rounded-xl bg-[#F5F2EC]/80 border border-[#E0DAD0] text-[11px] text-[#0F1420]/75 mb-5 space-y-1.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A052] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F1420]">{currentConfig.label} Access: </strong>
                {currentConfig.desc}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono pl-6 pt-0.5 text-gray-500">
              <KeyRound className="w-3 h-3 text-[#C9A052]" />
              {currentConfig.isStaff ? (
                <span className="text-emerald-700 font-bold">2FA (TOTP) Mandatory for Staff [USR-1]</span>
              ) : (
                <span>2FA Optional for Agents (toggle below)</span>
              )}
            </div>
          </div>

          {/* STEP 1: EMAIL & PASSWORD (USR-1) */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1420]/80 font-mono">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetOpen(true);
                    }}
                    className="text-[11px] text-[#C9A052] hover:text-[#9A7A35] font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
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

              {/* Optional 2FA checkbox for agent role */}
              {!currentConfig.isStaff && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#0F1420]/70 py-1">
                  <input
                    type="checkbox"
                    checked={agent2FaEnabled}
                    onChange={(e) => setAgent2FaEnabled(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span>Enable Two-Factor Authentication (TOTP) for Agent Account</span>
                </label>
              )}

              {/* Primary Gold Login Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {currentConfig.isStaff || agent2FaEnabled ? "Proceed to 2FA Verification" : `Log In as ${currentConfig.label}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: TOTP 2FA VERIFICATION (USR-1) */}
          {step === "2fa" && (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-[#0F1420] text-[#C9A052] flex items-center justify-center mx-auto shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#0F1420]">Two-Factor Authentication</h4>
                <p className="text-xs text-[#0F1420]/70">
                  Open your Google Authenticator or 1Password app and enter the 6-digit TOTP code for <strong className="text-[#0F1420]">{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1420]/80 mb-1.5 font-mono text-center">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/\D/g, ""));
                    setTotpError("");
                  }}
                  autoFocus
                  className="w-full text-center tracking-[0.4em] font-mono text-lg font-black bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl py-2.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052]"
                />
                {totpError && (
                  <p className="text-[11px] text-red-600 mt-1 text-center font-medium">{totpError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="px-4 py-2.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Verify & Enter System
                </button>
              </div>

              {/* Quick Auto-Fill TOTP Demo Helper */}
              <button
                type="button"
                onClick={() => {
                  setTotpCode("849201");
                  login(selectedRole, email, currentConfig.name);
                }}
                className="w-full py-1.5 text-[10px] text-gray-500 hover:text-[#C9A052] font-mono text-center underline"
              >
                Auto-fill demo code (849201) & enter
              </button>
            </form>
          )}

          {/* Quick Demo One-Click Access Buttons */}
          <div className="mt-5 pt-4 border-t border-[#E0DAD0] space-y-2">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-center text-[#0F1420]/50 font-bold">
              Instant One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => login("admin", "admin@orbelo.com", "Capt. Alexander Vance")}
                className="py-1.5 px-2.5 rounded-lg bg-[#0F1420] hover:bg-[#1A2338] text-white text-[10px] font-bold transition-all border border-[#0F1420] flex items-center justify-center gap-1"
              >
                <Shield className="w-3 h-3 text-[#C9A052]" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => login("operations", "ops@orbelo.com", "David Schneider")}
                className="py-1.5 px-2.5 rounded-lg bg-[#141A29] hover:bg-[#1C2436] text-white text-[10px] font-bold transition-all border border-[#1C2436] flex items-center justify-center gap-1"
              >
                <Cog className="w-3 h-3 text-[#C9A052]" />
                <span>Ops</span>
              </button>

              <button
                type="button"
                onClick={() => login("finance", "finance@orbelo.com", "Elena Rostova")}
                className="py-1.5 px-2.5 rounded-lg bg-[#141A29] hover:bg-[#1C2436] text-white text-[10px] font-bold transition-all border border-[#1C2436] flex items-center justify-center gap-1"
              >
                <CreditCard className="w-3 h-3 text-[#C9A052]" />
                <span>Finance</span>
              </button>

              <button
                type="button"
                onClick={() => login("super_admin", "admin@orbelo.com", "Maximilian von Bern")}
                className="py-1.5 px-2.5 rounded-lg bg-[#0B101A] hover:bg-[#141A29] text-white text-[10px] font-bold transition-all border border-[#C9A052]/40 flex items-center justify-center gap-1"
              >
                <Crown className="w-3 h-3 text-[#C9A052]" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => login("agent", "agent@orbelo.com", "Marcus Vance")}
                className="col-span-2 sm:col-span-2 py-1.5 px-2.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-[10px] font-bold transition-all border border-[#D1C9BC] flex items-center justify-center gap-1"
              >
                <Plane className="w-3 h-3 text-[#C9A052]" />
                <span>Charter Agent Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal (USR-5) */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">Password Reset</h3>
              </div>
              <button onClick={() => setIsResetOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">Password reset link sent!</p>
                <p className="text-[11px] text-emerald-700">Check {resetEmail} for an expiring secure reset token.</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-[#0F1420]/70">
                  Enter your corporate email address. A secure, time-limited reset link will be sent to your inbox.
                </p>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#F5F2EC] text-[#0F1420] text-xs font-bold border border-[#D1C9BC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#C9A052] text-[#0F1420] text-xs font-bold hover:bg-[#B88F42]"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer System Status */}
      <div className="text-center text-xs text-[#0F1420]/60 pb-2">
        <p className="font-mono text-[11px]">
          OPS Dispatch v2.4 • EASA Part-CAT & Austrian Civil Aviation Compliant • Session Security & Rate Throttling Active [USR-5]
        </p>
      </div>
    </div>
  );
}
