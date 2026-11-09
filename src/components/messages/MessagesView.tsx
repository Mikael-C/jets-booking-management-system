"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AppMessage, MessageAttachment } from "@/types/aviation";
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Hash,
  Shield,
  Plane,
  Coins,
  FileText,
  Receipt,
  Compass,
  ScrollText,
  User,
  Users,
  Check,
  CheckCheck,
  Eye,
  Sparkles,
  ChevronRight,
  Filter,
  Plus,
  ArrowUpRight
} from "lucide-react";

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "channel" | "direct";
  recipientEmail?: string;
  recipientName?: string;
  recipientRole?: string;
}

export default function MessagesView() {
  const {
    messages,
    refreshMessages,
    sendMessage,
    markMessageRead,
    currentUser,
    users,
    role,
    bookings,
    agentRequests,
    openDocument
  } = useAviation();

  const [activeChannelId, setActiveChannelId] = useState<string>("broker_desk");
  const [inputText, setInputText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedAttachmentBookingId, setSelectedAttachmentBookingId] = useState<string>("");
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-refresh messages on mount and on window focus
  useEffect(() => {
    refreshMessages?.();
    const handleFocus = () => refreshMessages?.();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshMessages]);

  const departmentChannels: ChannelConfig[] = [
    {
      id: "broker_desk",
      name: "broker_desk",
      description: "Charter Broker Desk & Inbound RFQ Dispatch",
      icon: Hash,
      category: "channel"
    },
    {
      id: "operations",
      name: "operations",
      description: "OCC Dispatch, Ramp Handling & ATC Eurocontrol Slots",
      icon: Hash,
      category: "channel"
    },
    {
      id: "finance",
      name: "finance",
      description: "Commercial Tax Invoices, Wire Transfers & Currency Settlement",
      icon: Hash,
      category: "channel"
    },
    {
      id: "client_services",
      name: "client_services",
      description: "VIP Passenger Concierge, Catering & Ground Transfers",
      icon: Hash,
      category: "channel"
    },
  ];

  // Dynamic direct message contacts:
  // Derived from `users` (excluding currentUser), plus any other unique email addresses present in `messages`
  const myEmail = (currentUser?.email || "").toLowerCase().trim();

  const dmContactsMap = new Map<string, { email: string; name: string; role: string; title?: string }>();

  // Add all registered users (excluding current user)
  (users || []).forEach((u) => {
    const uEmail = (u.email || "").trim().toLowerCase();
    if (uEmail && uEmail !== myEmail) {
      dmContactsMap.set(uEmail, {
        email: uEmail,
        name: u.name || uEmail.split("@")[0],
        role: u.role || "operations",
        title: u.title
      });
    }
  });

  // Also include any user from messages who isn't currentUser
  (messages || []).forEach((m) => {
    const sEmail = (m.senderEmail || "").trim().toLowerCase();
    if (sEmail && sEmail !== myEmail && !dmContactsMap.has(sEmail)) {
      dmContactsMap.set(sEmail, {
        email: sEmail,
        name: m.senderName || sEmail.split("@")[0],
        role: (m.senderRole as any) || "agent"
      });
    }
    const rEmail = (m.recipientEmail || "").trim().toLowerCase();
    if (rEmail && rEmail !== myEmail && !dmContactsMap.has(rEmail)) {
      dmContactsMap.set(rEmail, {
        email: rEmail,
        name: m.recipientName || rEmail.split("@")[0],
        role: (m.recipientRole as any) || "agent"
      });
    }
  });

  const directChannels: ChannelConfig[] = Array.from(dmContactsMap.values()).map((contact) => ({
    id: `dm-${contact.email}`,
    name: contact.name,
    description: `Direct channel with ${contact.name}${contact.title ? ` • ${contact.title}` : ""}`,
    icon: User,
    category: "direct",
    recipientEmail: contact.email,
    recipientName: contact.name,
    recipientRole: contact.role
  }));

  const channels: ChannelConfig[] = [...departmentChannels, ...directChannels];

  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  // Filter messages for current channel / DM (case-insensitive)
  const channelMessages = messages.filter((m) => {
    const userEmail = (currentUser?.email || "").toLowerCase().trim();
    const mSender = (m.senderEmail || "").toLowerCase().trim();
    const mRecipient = (m.recipientEmail || "").toLowerCase().trim();

    if (currentChannel.category === "direct") {
      const targetEmail = (currentChannel.recipientEmail || "").toLowerCase().trim();
      return (
        (mSender === targetEmail && (mRecipient === userEmail || !mRecipient)) ||
        (mRecipient === targetEmail && (mSender === userEmail || !mSender)) ||
        m.channel === currentChannel.id
      );
    }
    return m.channel === currentChannel.id || m.channel === currentChannel.name;
  });

  const displayedMessages = channelMessages.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      (m.tripNumber && m.tripNumber.toLowerCase().includes(q))
    );
  });

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages.length]);

  // Mark visible unread messages as read
  useEffect(() => {
    const userEmail = (currentUser?.email || "").toLowerCase().trim();
    displayedMessages.forEach((m) => {
      const sEmail = (m.senderEmail || "").toLowerCase().trim();
      if (!m.read && sEmail !== userEmail) {
        markMessageRead(m.id);
      }
    });
  }, [displayedMessages, currentUser?.email, markMessageRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedAttachmentBookingId) return;

    let attachments: MessageAttachment[] = [];
    let linkedTripNumber = "";

    if (selectedAttachmentBookingId) {
      const foundBooking = bookings.find((b) => b.id === selectedAttachmentBookingId || b.tripNumber === selectedAttachmentBookingId);
      if (foundBooking) {
        linkedTripNumber = foundBooking.tripNumber;
        attachments.push({
          name: `Official_Quotation_${foundBooking.tripNumber}.pdf`,
          type: "quotation",
          tripNumber: foundBooking.tripNumber,
          docType: "quotation",
          fileSize: "280 KB"
        });
      }
    }

    await sendMessage({
      channel: currentChannel.category === "channel" ? currentChannel.name : "direct",
      recipientEmail: currentChannel.recipientEmail,
      recipientName: currentChannel.recipientName,
      recipientRole: currentChannel.recipientRole,
      content: inputText.trim() || `Attached document for trip ${linkedTripNumber}`,
      tripNumber: linkedTripNumber,
      attachments
    });

    setInputText("");
    setSelectedAttachmentBookingId("");
    setShowAttachmentPicker(false);
  };

  const handleOpenAttachedDoc = (tripNumber: string, docType?: string) => {
    const booking = bookings.find((b) => b.tripNumber === tripNumber || b.id === tripNumber);
    if (booking) {
      const type = (docType || "quotation") as any;
      openDocument(booking, type);
    }
  };

  const getRoleBadge = (mRole: string) => {
    switch (mRole) {
      case "super_admin":
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 border border-purple-500/30">Super Admin</span>;
      case "admin":
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 border border-blue-500/30">Admin Ops</span>;
      case "operations":
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30">OCC Ops</span>;
      case "finance":
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 border border-emerald-500/30">Finance</span>;
      case "agent":
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#C9A052]/20 text-[#0F1420] border border-[#C9A052]/40 font-black">Broker</span>;
      default:
        return <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Team</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-[#C9A052] tracking-wider">
              Real-Time Operations Communications
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F1420] tracking-tight mt-1 flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#C9A052]" />
            <span>Executive Messages & In-App Dispatch</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Secure cross-departmental communications between Super Admin, Operations, Finance, and Broker Agents.
          </p>
        </div>

        {/* Global Live Indicator */}
        <div className="flex items-center gap-2.5 bg-[#F5F2EC] px-3.5 py-2 rounded-xl border border-[#E0DAD0]">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
          <div className="text-left">
            <p className="text-[10px] font-mono uppercase font-bold text-gray-500">Dispatch Status</p>
            <p className="text-xs font-extrabold text-[#0F1420]">Active & Encrypted</p>
          </div>
        </div>
      </div>

      {/* Main Messaging Canvas: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden min-h-[640px]">
        {/* Left Column: Channels & Contacts Sidebar (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#E0DAD0] bg-[#FAF8F5] flex flex-col">
          {/* Sidebar Search Bar */}
          <div className="p-4 border-b border-[#E0DAD0]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages, trips, brokers..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white border border-[#E0DAD0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] shadow-inner"
              />
            </div>
          </div>

          {/* Channels Section */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                Department Channels
              </div>
              <div className="space-y-1">
                {channels
                  .filter((c) => c.category === "channel")
                  .map((ch) => {
                    const isActive = activeChannelId === ch.id;
                    const unreadInCh = messages.filter(
                      (m) => (m.channel === ch.id || m.channel === ch.name) && !m.read && m.senderEmail !== currentUser?.email
                    ).length;

                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChannelId(ch.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#0F1420] text-white shadow-md"
                            : "text-[#0F1420]/80 hover:bg-[#EAE5DA]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className={`w-4 h-4 ${isActive ? "text-[#C9A052]" : "text-gray-400"}`} />
                          <span className="truncate">{ch.name}</span>
                        </div>
                        {unreadInCh > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052] text-[#0F1420]">
                            {unreadInCh}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Direct Messages Section */}
            <div>
              <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                Direct Inquiries & Staff
              </div>
              <div className="space-y-1">
                {channels
                  .filter((c) => c.category === "direct")
                  .map((dm) => {
                    const isActive = activeChannelId === dm.id;
                    const dmEmail = (dm.recipientEmail || "").toLowerCase().trim();
                    const unreadInDm = messages.filter((m) => {
                      if (m.read) return false;
                      const sEmail = (m.senderEmail || "").toLowerCase().trim();
                      const rEmail = (m.recipientEmail || "").toLowerCase().trim();
                      const userEmail = (currentUser?.email || "").toLowerCase().trim();
                      return sEmail === dmEmail && (rEmail === userEmail || !rEmail);
                    }).length;

                    return (
                      <button
                        key={dm.id}
                        onClick={() => setActiveChannelId(dm.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#0F1420] text-white shadow-md"
                            : "text-[#0F1420]/80 hover:bg-[#EAE5DA]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                            isActive ? "bg-[#C9A052] text-[#0F1420]" : "bg-gray-200 text-gray-700"
                          }`}>
                            {dm.name.charAt(0)}
                          </div>
                          <span className="truncate">{dm.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unreadInDm > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052] text-[#0F1420]">
                              {unreadInDm}
                            </span>
                          )}
                          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat Feed & Dispatch Input (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[640px] bg-white">
          {/* Active Channel Header */}
          <div className="p-4 border-b border-[#E0DAD0] flex items-center justify-between bg-[#FCFBF9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F1420] flex items-center justify-center">
                {currentChannel.category === "channel" ? (
                  <Hash className="w-5 h-5 text-[#C9A052]" />
                ) : (
                  <User className="w-5 h-5 text-[#C9A052]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F1420] flex items-center gap-2">
                  <span>{currentChannel.name}</span>
                  {currentChannel.recipientRole && getRoleBadge(currentChannel.recipientRole)}
                </h3>
                <p className="text-[11px] text-gray-500">{currentChannel.description}</p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Orbelo Ops Engine</span>
              <p className="text-[11px] font-mono font-bold text-emerald-700">Encrypted Channel</p>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFBF9]/40">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#C9A052]" />
                </div>
                <h4 className="text-sm font-bold text-[#0F1420]">No Messages Yet</h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  Start the conversation in <span className="font-semibold text-[#0F1420]">{currentChannel.name}</span> or attach a booking document to share.
                </p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isCurrentUser = msg.senderEmail?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim();
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  >
                    {/* User Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${
                        isCurrentUser
                          ? "bg-[#C9A052] text-[#0F1420]"
                          : "bg-[#0F1420] text-white"
                      }`}
                    >
                      {msg.senderName.charAt(0)}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[82%] sm:max-w-[70%] space-y-1.5 ${
                        isCurrentUser ? "items-end text-right" : "items-start text-left"
                      }`}
                    >
                      {/* Sender Details */}
                      <div className={`flex items-center gap-2 text-[11px] ${isCurrentUser ? "justify-end" : ""}`}>
                        <span className="font-bold text-[#0F1420]">
                          {isCurrentUser ? `${msg.senderName} (You)` : msg.senderName}
                        </span>
                        {getRoleBadge(msg.senderRole)}
                        <span className="text-[10px] font-mono text-gray-400">{msg.timestamp}</span>
                      </div>

                      {/* Content Card */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isCurrentUser
                            ? "bg-[#0F1420] text-white rounded-tr-none"
                            : "bg-white text-[#0F1420] border border-[#E0DAD0] rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Attached Official Document Card */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/15 space-y-2">
                            {msg.attachments.map((att, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                  isCurrentUser
                                    ? "bg-[#141A29] border-[#C9A052]/40"
                                    : "bg-[#F5F2EC] border-[#E0DAD0]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-[#C9A052]/20 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-[#C9A052]" />
                                  </div>
                                  <div className="truncate text-left">
                                    <p className={`text-[11px] font-bold truncate ${isCurrentUser ? "text-white" : "text-[#0F1420]"}`}>
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] font-mono text-gray-400">
                                      {att.tripNumber ? `Trip ${att.tripNumber}` : "Official PDF Document"}
                                    </p>
                                  </div>
                                </div>

                                {att.tripNumber && (
                                  <button
                                    onClick={() => handleOpenAttachedDoc(att.tripNumber!, att.docType)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Preview</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Selector Drawer (Toggled via Paperclip) */}
          {showAttachmentPicker && (
            <div className="p-3 bg-[#FAF8F5] border-t border-[#E0DAD0] flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-gray-500">Attach Booking PDF:</span>
              <select
                value={selectedAttachmentBookingId}
                onChange={(e) => setSelectedAttachmentBookingId(e.target.value)}
                className="bg-white border border-[#E0DAD0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="">-- Select a Trip / Booking to Attach --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tripNumber} — {b.client.fullName} ({b.aircraft.name})
                  </option>
                ))}
              </select>
              {selectedAttachmentBookingId && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready to transmit with message
                </span>
              )}
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-[#E0DAD0] bg-white">
            <div className="flex items-center gap-2 bg-[#FDFCFA] border border-[#E0DAD0] rounded-2xl p-1.5 focus-within:border-[#C9A052] shadow-sm">
              <button
                type="button"
                onClick={() => setShowAttachmentPicker(!showAttachmentPicker)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showAttachmentPicker || selectedAttachmentBookingId
                    ? "bg-[#C9A052] text-[#0F1420]"
                    : "text-gray-400 hover:text-[#0F1420] hover:bg-gray-100"
                }`}
                title="Attach Official Quote or Booking PDF"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={currentChannel.category === "channel" ? `Message #${currentChannel.name}...` : `Message ${currentChannel.recipientName || currentChannel.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent px-2 py-1 text-xs text-[#0F1420] focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !selectedAttachmentBookingId}
                className="px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
