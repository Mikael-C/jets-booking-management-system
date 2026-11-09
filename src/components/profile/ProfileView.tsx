"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import {
  User,
  Shield,
  Coins,
  KeyRound,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Bell,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  FileText,
  Compass,
  Zap,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  DollarSign
} from "lucide-react";

export default function ProfileView() {
  const {
    currentUser,
    role,
    tokenBalance,
    tokenTier,
    subscriptionStatus,
    subscriptionExpiresAt,
    tokenTransactions,
    openTokenModal,
    updateUserProfile,
    changeUserPassword
  } = useAviation();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "tokenomics" | "roles">(
    role === "agent" ? "profile" : "profile"
  );

  // Profile form state
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "+44 20 7946 0912");
  const [title, setTitle] = useState(currentUser?.title || "Charter Broker");
  const [company, setCompany] = useState(currentUser?.company || "Orbelo Aviation Partner");
  const [location, setLocation] = useState(currentUser?.location || "London, Mayfair, United Kingdom");
  const [bio, setBio] = useState(
    currentUser?.bio ||
      "Dedicated aviation professional managing private jet charter requests, client flight operations, and bespoke travel solutions."
  );

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(currentUser?.notificationPreferences?.emailAlerts ?? true);
  const [flightUpdates, setFlightUpdates] = useState(currentUser?.notificationPreferences?.flightUpdates ?? true);
  const [tokenAlerts, setTokenAlerts] = useState(currentUser?.notificationPreferences?.tokenAlerts ?? true);
  const [marketing, setMarketing] = useState(currentUser?.notificationPreferences?.marketing ?? false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      await updateUserProfile({
        name,
        phone,
        title,
        company,
        location,
        bio,
        notificationPreferences: {
          emailAlerts,
          flightUpdates,
          tokenAlerts,
          marketing
        }
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordSuccess(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.message);
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case "super_admin":
        return { label: "SUPER ADMIN", color: "bg-red-500/15 text-red-500 border-red-500/30", icon: ShieldAlert };
      case "admin":
        return { label: "OPERATIONS DIRECTOR", color: "bg-[#C9A052]/20 text-[#C9A052] border-[#C9A052]/40", icon: Shield };
      case "finance":
        return { label: "FINANCE OFFICER", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: DollarSign };
      case "operations":
        return { label: "OCC DISPATCH", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Compass };
      case "agent":
      default:
        return { label: "CHARTER BROKER", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Coins };
    }
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;
  const isAgent = role === "agent";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* ─── Profile Header Banner ─── */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#C9A052]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* User Avatar Circle */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0F1420] to-[#1A2338] text-white font-black text-2xl flex items-center justify-center border-2 border-[#C9A052] shadow-lg">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Account Active">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            {/* Identity Text */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1 ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  ID: {currentUser?.id || "usr-current"}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#0F1420] tracking-tight">
                {currentUser?.name || "Private Aviation User"}
              </h1>
              <p className="text-xs text-[#0F1420]/70 font-medium mt-0.5 flex flex-wrap items-center gap-3">
                <span>{currentUser?.title || "Platform Member"}</span>
                <span>•</span>
                <span className="font-mono text-gray-500">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          {/* Quick Stat Card: Agent Tokens or Staff Clearance */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3.5 sm:p-4 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] min-w-[200px]">
            {isAgent ? (
              <>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F1420]/60 flex items-center sm:justify-end gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#C9A052]" /> Token Balance
                  </span>
                  <div className="text-2xl font-black font-mono text-[#0F1420] mt-0.5">
                    {tokenBalance.toLocaleString()} <span className="text-xs font-normal text-gray-500">Tokens</span>
                  </div>
                </div>
                <button
                  onClick={() => openTokenModal("Refill your agent tokens to continue accessing quoting and sourcing")}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Refill / Sub</span>
                </button>
              </>
            ) : (
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center sm:justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Staff Exemption
                </span>
                <div className="text-base font-bold text-[#0F1420] mt-0.5">
                  Unlimited Access
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Tokens bypassed for internal ops</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-[#E0DAD0] overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/60 hover:text-[#0F1420] hover:bg-gray-100"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "security"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/60 hover:text-[#0F1420] hover:bg-gray-100"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab("tokenomics")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "tokenomics"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/60 hover:text-[#0F1420] hover:bg-gray-100"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Tokenomics & Subscription</span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/60 hover:text-[#0F1420] hover:bg-gray-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role & Permissions</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: Profile Details ─── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0DAD0]">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Personal & Brokerage Information
                </h3>
                <p className="text-xs text-[#0F1420]/60 mt-0.5">
                  Update your contact card, brokerage affiliation, and flight dispatch identifiers.
                </p>
              </div>

              {profileSaveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Changes Saved Successfully!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C9A052]" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C9A052]" /> Corporate Email Address
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Primary Auth Key</span>
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full bg-gray-100 border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C9A052]" /> Direct Telephone / Mobile
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A052]" /> Official Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              {/* Company / Brokerage */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#C9A052]" /> Company / Brokerage Entity
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A052]" /> Operational City / Country
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>

            {/* Bio / Specialty */}
            <div>
              <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1.5">
                Professional Bio & Charter Logistics Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] leading-relaxed"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C9A052]" /> Notification & Alert Subscriptions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] cursor-pointer hover:border-[#C9A052] transition-colors">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="mt-0.5 rounded text-[#C9A052] focus:ring-0"
                />
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">Charter Quotation & Request Updates</p>
                  <p className="text-[10px] text-gray-500">Receive email notifications when dispatch quotes are finalized.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] cursor-pointer hover:border-[#C9A052] transition-colors">
                <input
                  type="checkbox"
                  checked={flightUpdates}
                  onChange={(e) => setFlightUpdates(e.target.checked)}
                  className="mt-0.5 rounded text-[#C9A052] focus:ring-0"
                />
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">OCC Real-Time Dispatch Notices</p>
                  <p className="text-[10px] text-gray-500">Tail registration, slot clearances, and crew briefing releases.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] cursor-pointer hover:border-[#C9A052] transition-colors">
                <input
                  type="checkbox"
                  checked={tokenAlerts}
                  onChange={(e) => setTokenAlerts(e.target.checked)}
                  className="mt-0.5 rounded text-[#C9A052] focus:ring-0"
                />
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">Token Balance & Refill Reminders</p>
                  <p className="text-[10px] text-gray-500">Alerts when token balance drops below 200 tokens.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] cursor-pointer hover:border-[#C9A052] transition-colors">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-0.5 rounded text-[#C9A052] focus:ring-0"
                />
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">Empty Leg & Market Intelligence</p>
                  <p className="text-[10px] text-gray-500">Weekly European and transatlantic transient fleet opportunities.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#C9A052]" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: Security & Password ─── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-[#E0DAD0]">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C9A052]" /> Change Master Password
              </h3>
              <p className="text-xs text-[#0F1420]/60 mt-0.5">
                Passwords must be at least 6 characters. Updating will invalidate any stale active tokens.
              </p>
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-[#0F1420] uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-6 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingPassword ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#C9A052]" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Standards Overview */}
          <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#C9A052] mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Account Session & Security Policy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-300 pt-2">
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#1C2436]">
                <p className="text-gray-400 font-mono text-[10px] uppercase">Active Session</p>
                <p className="font-bold text-white mt-1">Bearer JWT with HMAC-SHA256</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#1C2436]">
                <p className="text-gray-400 font-mono text-[10px] uppercase">Session Invalidation</p>
                <p className="font-bold text-white mt-1">Automatic upon password reset</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#1C2436]">
                <p className="text-gray-400 font-mono text-[10px] uppercase">Role Authorization</p>
                <p className="font-bold text-white mt-1">RBAC Enforced via Express Middleware</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Tokenomics & Subscription ─── */}
      {activeTab === "tokenomics" && (
        <div className="space-y-6">
          {/* Main Token Balance Hero */}
          <div className="bg-gradient-to-br from-[#0F1420] to-[#1A2338] text-white border border-[#C9A052]/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 flex items-center gap-1.5 w-fit mb-2">
                  <Coins className="w-3.5 h-3.5" /> AGENT TOKENOMICS ENGINE
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Available Platform Tokens
                </h3>
                <p className="text-xs text-gray-300 mt-1 max-w-lg">
                  Tokens power your broker access. Each official quote generation, flight brief, tax invoice, and Avinode inquiry deducts 100 tokens.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    STATUS: {subscriptionStatus.toUpperCase()}
                  </span>
                  <span className="text-gray-400">
                    TIER: {tokenTier.toUpperCase()}
                  </span>
                  {subscriptionExpiresAt && (
                    <span className="text-gray-400">
                      RENEWAL: {new Date(subscriptionExpiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Big Token Number & CTA */}
              <div className="p-6 rounded-2xl bg-[#0B101A] border border-[#C9A052]/30 text-center sm:text-right min-w-[220px]">
                <p className="text-[10px] font-mono uppercase text-gray-400">Current Balance</p>
                <div className="text-4xl font-black font-mono text-[#C9A052] my-1">
                  {tokenBalance.toLocaleString()}
                </div>
                <p className="text-[11px] text-gray-400 font-mono mb-3">
                  {Math.floor(tokenBalance / 100)} actions remaining
                </p>
                <button
                  onClick={() => openTokenModal("Top up your token balance")}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Refill / Subscribe</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Usage Structure Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Package Details */}
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A052]" /> Standard Subscription Package
              </h4>
              <div className="p-4 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] flex items-baseline justify-between">
                <div>
                  <p className="text-base font-black text-[#0F1420]">2,000 Action Tokens</p>
                  <p className="text-xs text-[#0F1420]/60">30 Days Active Quota</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#0F1420]">£500 / $600</span>
                  <p className="text-[10px] font-mono text-gray-500">GBP or USD equivalent</p>
                </div>
              </div>
              <ul className="text-xs text-[#0F1420]/75 space-y-2 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>20 full requests included per billing cycle</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Immediate unlocking upon credit or bank wire receipt</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Rollover unused tokens when refilling before expiration</span>
                </li>
              </ul>
            </div>

            {/* Consumption Rate */}
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C9A052]" /> Action Token Costs (100 Tokens / Action)
              </h4>
              <div className="divide-y divide-[#E0DAD0] text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#0F1420]">
                    <FileText className="w-3.5 h-3.5 text-[#C9A052]" />
                    Generate Quote Request
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100 Tokens
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#0F1420]">
                    <Compass className="w-3.5 h-3.5 text-[#C9A052]" />
                    Flight Brief Generation
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100 Tokens
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#0F1420]">
                    <Receipt className="w-3.5 h-3.5 text-[#C9A052]" />
                    Commercial Tax Invoice
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100 Tokens
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#0F1420]">
                    <Zap className="w-3.5 h-3.5 text-[#C9A052]" />
                    Avinode Marketplace Sourcing
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    100 Tokens
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Token Transactions History */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C9A052]" /> Token Activity & Transaction Ledger
              </h4>
              <span className="text-[11px] font-mono text-gray-500">
                {tokenTransactions.length} Record(s)
              </span>
            </div>

            <div className="overflow-x-auto border border-[#E0DAD0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F2EC] border-b border-[#E0DAD0] text-[10px] font-mono font-bold uppercase text-[#0F1420]/70">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DAD0] text-[#0F1420]">
                  {tokenTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400 font-mono">
                        No token transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    tokenTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors font-mono text-[11px]">
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString()}{" "}
                          <span className="text-[9px] text-gray-400">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              tx.type === "credit"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-[#0F1420] whitespace-nowrap">
                          {tx.action}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-gray-600 max-w-xs truncate" title={tx.description}>
                          {tx.description || "Token adjustment"}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                            tx.type === "credit" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {tx.type === "credit" ? `+${tx.amount}` : `-${tx.amount}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#0F1420] whitespace-nowrap">
                          {tx.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Role & Permissions ─── */}
      {activeTab === "roles" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#E0DAD0]">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit mb-2 ${badge.color}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
            <h3 className="text-lg font-black text-[#0F1420]">
              Role Authority Matrix & Access Control
            </h3>
            <p className="text-xs text-[#0F1420]/60 mt-0.5">
              Review assigned security permissions and operational boundaries for your account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] space-y-2">
              <h4 className="text-xs font-bold font-mono uppercase text-[#0F1420] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Permitted Capabilities
              </h4>
              <ul className="text-xs text-[#0F1420]/80 space-y-1.5 list-disc pl-5">
                {role === "super_admin" && (
                  <>
                    <li>Full Master Administrative Control across all modules</li>
                    <li>Provision & Manage User Accounts for all roles</li>
                    <li>System Audit Log Inspection & Security Logs</li>
                    <li>One-click database seed trigger</li>
                  </>
                )}
                {role === "admin" && (
                  <>
                    <li>Flight Dispatch, Routing & Fleet Schedule Management</li>
                    <li>Generate Quotes, Flight Briefs & Commercial Invoices</li>
                    <li>Avinode Marketplace Live Sourcing & RFQ Execution</li>
                    <li>Fulfill incoming Broker Agent Requests</li>
                  </>
                )}
                {role === "finance" && (
                  <>
                    <li>Payments Processing, SEPA Wire Confirmations</li>
                    <li>P&L Margins, Broker Commissions & Commercial Invoices</li>
                    <li>Billing Ledger Export & Tax Records</li>
                  </>
                )}
                {role === "operations" && (
                  <>
                    <li>Pre-flight Dispatch Checklist & Slot Approvals</li>
                    <li>FBO Ramp Transfers & Handling Coordination</li>
                    <li>Passenger Manifest Verification & Crew Roster</li>
                  </>
                )}
                {role === "agent" && (
                  <>
                    <li>Submit Outbound Quote Requests to Admin Dispatch (100 tokens)</li>
                    <li>Request Automated Flight Brief Documentation (100 tokens)</li>
                    <li>Request Official Client Invoices with Broker Commission (100 tokens)</li>
                    <li>Track Active Requests & Client Itineraries</li>
                    <li>Top up Token Balance via GBP/USD Stripe or SEPA Wire</li>
                  </>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] space-y-2">
              <h4 className="text-xs font-bold font-mono uppercase text-[#0F1420] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C9A052]" />
                Security & Compliance Clearance
              </h4>
              <p className="text-xs text-[#0F1420]/75 leading-relaxed">
                Your account is governed by Orbelo Aviation Operations security policy v2.4, Austrian Commercial Law, and EASA Part-CAT compliance regulations.
              </p>
              <div className="pt-2 text-[11px] font-mono text-gray-500 space-y-1">
                <p>• Data Encryption: AES-256 at rest</p>
                <p>• Transport Security: TLS 1.3 enforced</p>
                <p>• Audit Trail: Immutable event logging on all transactions</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
