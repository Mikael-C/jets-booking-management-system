"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import {
  Plane,
  Lock,
  Mail,
  ArrowRight,
  RotateCcw,
  X,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export default function LoginScreen() {
  const { login } = useAviation();
  const [email, setEmail] = useState("superadmin@orbelo.com");
  const [password, setPassword] = useState("orbelo2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Password Reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const testAccounts = [
    { label: "Super Admin", email: "superadmin@orbelo.com", desc: "Executive Overview & System Control" },
    { label: "Admin / Sales", email: "admin@orbelo.com", desc: "Charter Bookings & Dispatch Control" },
    { label: "Finance", email: "finance@orbelo.com", desc: "Payments & Commercial Invoices" },
    { label: "Operations", email: "ops@orbelo.com", desc: "Flight Operations & Dispatch" },
    { label: "Charter Agent", email: "agent@orbelo.com", desc: "Broker Quoting & Deals Pipeline" },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your corporate email.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      // Authenticates with credentials, detects role, and routes to respective dashboard
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid email or password. Please verify your credentials.");
      setIsLoading(false);
    }
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

      {/* Main Single Login Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle gold accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C9A052]" />

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-[#0F1420] tracking-tight">
              Executive Portal Login
            </h2>
            <p className="text-xs text-[#0F1420]/60 mt-1">
              Sign in with your corporate credentials to access your executive workspace
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Single Unified Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1420]/80 mb-1.5 font-mono">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#0F1420]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="name@orbelo.com"
                  required
                  autoFocus
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
                  className="text-[11px] text-[#C9A052] hover:text-[#9A7A35] font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#0F1420]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0F1420] placeholder-[#0F1420]/40 focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#0F1420]/70 bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 mt-1.5">
                <span>Default password: <strong className="text-[#0F1420] font-bold font-mono">orbelo2026!</strong></span>
                <button
                  type="button"
                  onClick={() => setPassword("orbelo2026!")}
                  className="text-[10px] text-[#C9A052] font-bold hover:underline cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            </div>

            {/* Primary Gold Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F1420]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Executive Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Test Accounts Quick Fill Helper (Pills populate input, does not act as role selector) */}
          <div className="mt-6 pt-4 border-t border-[#E0DAD0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/60 font-bold">
                Quick Demo Accounts (Click to fill email):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {testAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("orbelo2026!");
                    if (errorMessage) setErrorMessage("");
                  }}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    email.toLowerCase() === acc.email.toLowerCase()
                      ? "bg-[#0F1420] text-[#C9A052] border-[#0F1420] font-bold shadow-sm"
                      : "bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420]/80 border-[#E0DAD0]"
                  }`}
                  title={`${acc.desc} (${acc.email})`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">Password Reset</h3>
              </div>
              <button onClick={() => setIsResetOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
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
                    className="px-4 py-2 rounded-xl bg-[#F5F2EC] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#C9A052] text-[#0F1420] text-xs font-bold hover:bg-[#B88F42] cursor-pointer"
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
          OPS Dispatch v2.4 • EASA Part-CAT & Austrian Civil Aviation Compliant • Session Security Active
        </p>
      </div>
    </div>
  );
}
