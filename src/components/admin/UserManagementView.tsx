"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { UserRecord, UserRole } from "@/types/aviation";
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  CreditCard,
  Cog,
  Plane,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  KeyRound,
  Mail,
  Phone,
  UserCheck,
  UserX,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  Sparkles
} from "lucide-react";

export default function UserManagementView() {
  const { users, addUser, updateUser, deleteUser, refreshUsers, role: currentRole, currentUser } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form states for creating a new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("agent");
  const [newPassword, setNewPassword] = useState("orbelo2026!");
  const [newTitle, setNewTitle] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for editing
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("agent");
  const [editTitle, setEditTitle] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");

  const isSuperAdmin = currentRole === "super_admin";

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const staffCount = users.filter((u) => u.role !== "agent").length;
  const agentCount = users.filter((u) => u.role === "agent").length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenCreate = () => {
    setNewName("");
    setNewEmail("");
    setNewRole(isSuperAdmin ? "admin" : "agent");
    setNewPassword("orbelo2026!");
    setNewTitle("");
    setNewPhone("");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newName.trim() || !newEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setFormError("A user with this email address already exists.");
      return;
    }

    if (newRole === "super_admin" && !isSuperAdmin) {
      setFormError("Only a Super Admin can create other Super Admin accounts.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword || "orbelo2026!",
        role: newRole,
        title: newTitle.trim(),
        phone: newPhone.trim(),
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditTitle(user.title || "");
    setEditIsActive(user.isActive);
    setEditPassword("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      const updates: any = {
        name: editName.trim(),
        role: editRole,
        title: editTitle.trim(),
        isActive: editIsActive,
      };
      if (editPassword.trim()) {
        updates.password = editPassword.trim();
      }
      await updateUser(selectedUser.id, updates);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    if (user.role === "super_admin" && !isSuperAdmin) return;
    await updateUser(user.id, { isActive: !user.isActive });
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40">
            <Crown className="w-3 h-3 text-[#C9A052]" />
            SUPER ADMIN
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Shield className="w-3 h-3 text-blue-600" />
            ADMIN / SALES
          </span>
        );
      case "finance":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CreditCard className="w-3 h-3 text-emerald-600" />
            FINANCE DESK
          </span>
        );
      case "operations":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Cog className="w-3 h-3 text-purple-600" />
            OPERATIONS
          </span>
        );
      case "agent":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Plane className="w-3 h-3 text-amber-600" />
            CHARTER AGENT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 uppercase flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Role-Based Access Control (RBAC)
            </span>
            <span className="text-xs text-[#0F1420]/60">Orbelo Identity Management</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            User Directory & Access Governance
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Provision staff members, assign security roles, toggle account active status, and audit operator privilege levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-[#E0DAD0] hover:bg-[#F5F2EC] text-[#0F1420] transition-colors cursor-pointer"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#C9A052]" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C9A052]" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0F1420] text-[#C9A052]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Total Accounts</p>
            <p className="text-xl font-black text-[#0F1420]">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Active Accounts</p>
            <p className="text-xl font-black text-emerald-700">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Operations Staff</p>
            <p className="text-xl font-black text-blue-700">{staffCount}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Charter Brokers</p>
            <p className="text-xl font-black text-amber-700">{agentCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#0F1420]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, corporate email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-10 pr-4 py-2 text-xs text-[#0F1420] placeholder-[#0F1420]/40 focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E0DAD0]/60">
          <span className="text-[10px] font-mono uppercase text-gray-400 font-bold mr-1">Role:</span>
          {[
            { id: "all", label: "All Roles" },
            { id: "super_admin", label: "Super Admin" },
            { id: "admin", label: "Admin / Sales" },
            { id: "finance", label: "Finance Desk" },
            { id: "operations", label: "Operations" },
            { id: "agent", label: "Charter Agent" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                roleFilter === r.id
                  ? "bg-[#0F1420] text-[#C9A052] shadow-sm"
                  : "bg-[#F5F2EC] text-[#0F1420]/70 hover:text-[#0F1420] hover:bg-[#EAE6DE]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F2EC] border-b border-[#E0DAD0] text-[#0F1420]/70 font-mono uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role & Authority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No users match your current search and filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = currentUser?.email === user.email;
                  const canManage = isSuperAdmin || (currentRole === "admin" && user.role !== "super_admin");

                  return (
                    <tr key={user.id} className="hover:bg-[#F5F2EC]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#0F1420] text-[#C9A052] font-black text-xs flex items-center justify-center flex-shrink-0 border border-[#C9A052]/30 shadow-sm">
                            {user.name ? user.name.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0F1420]">{user.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-mono">{user.email}</p>
                            {user.title && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{user.title}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          disabled={!canManage || isCurrentUser}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${
                            user.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
                          } ${!canManage || isCurrentUser ? "cursor-default opacity-85" : "cursor-pointer"}`}
                          title={canManage ? "Click to toggle active state" : undefined}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-600 animate-pulse" : "bg-red-600"
                            }`}
                          />
                          <span>{user.isActive ? "ACTIVE" : "SUSPENDED"}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {user.lastLogin || "2 hours ago"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F1420] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
                            title="Edit user role or details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isSuperAdmin && !isCurrentUser && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0F1420] text-[#C9A052]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F1420]">Provision New System User</h3>
                  <p className="text-[11px] text-gray-500">Configure credentials and assign security permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jean-Luc Moreau"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. jeanluc@orbelo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">
                    System Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                  >
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    <option value="admin">Admin / Sales</option>
                    <option value="finance">Finance Desk</option>
                    <option value="operations">Flight Operations</option>
                    <option value="agent">Charter Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">Job Title / Desk</label>
                  <input
                    type="text"
                    placeholder="e.g. Charter Broker"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">Direct Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +43 732 998811"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-[11px] text-[#0F1420]/75 space-y-1">
                <span className="font-bold text-[#0F1420]">Role Permissions Summary:</span>
                <p>
                  {newRole === "super_admin" && "Full administrative power, billing oversight, user provisioning, global margin config."}
                  {newRole === "admin" && "Operations oversight, RFQ fulfillment, official quote dispatch, and booking creation."}
                  {newRole === "finance" && "Commercial tax invoices, international wire reconciliations, payment settlements."}
                  {newRole === "operations" && "Flight dispatch, checklist completions, crew rosters, ground handling."}
                  {newRole === "agent" && "Submit quotation RFQs, review personal charter requests, client CRM."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-[#C9A052]" />
                  <span>{isSubmitting ? "Provisioning..." : "Provision User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0F1420] text-[#C9A052]">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F1420]">Edit User: {selectedUser.name}</h3>
                  <p className="text-[11px] text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={selectedUser.role === "super_admin" && !isSuperAdmin}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                  >
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    <option value="admin">Admin / Sales</option>
                    <option value="finance">Finance Desk</option>
                    <option value="operations">Flight Operations</option>
                    <option value="agent">Charter Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="text"
                  placeholder="New password (optional)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-[#0F1420] cursor-pointer">
                  Account Active & Enabled
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-[#C9A052]" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-[#0F1420]">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete the account for{" "}
              <strong className="text-[#0F1420]">{selectedUser.name}</strong> ({selectedUser.email})?
              This action cannot be undone and will revoke all access immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E0DAD0]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
