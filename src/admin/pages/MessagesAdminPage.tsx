import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/toast/toastSlice';
import {
  Mail,
  MailOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Archive,
  CornerDownRight,
  Shield,
  Tag,
  Building,
} from 'lucide-react';

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  department?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  isRead: boolean;
  staffNotes?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessagesAdminPageProps {
  onRefreshParent?: () => void;
}

export const MessagesAdminPage: React.FC<MessagesAdminPageProps> = ({ onRefreshParent }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    unread: number;
    byStatus: { new: number; read: number; replied: number; archived: number };
  }>({ total: 0, unread: 0, byStatus: { new: 0, read: 0, replied: 0, archived: 0 } });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Selected for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadMessages();
    loadStats();
  }, [activeTab, searchQuery]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/messages?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Failed to load contact messages', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/messages/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load message stats', err);
    }
  };

  const handleOpenMessage = async (msg: ContactMessageItem) => {
    setSelectedMessage(msg);
    setStaffNoteInput(msg.staffNotes || '');

    // If message is unread, automatically mark it as read
    if (!msg.isRead) {
      try {
        await fetch(`/api/admin/messages/${msg.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ isRead: true, status: msg.status === 'new' ? 'read' : msg.status }),
        });

        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, isRead: true, status: m.status === 'new' ? 'read' : m.status } : m
          )
        );
        loadStats();
        if (onRefreshParent) onRefreshParent();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'read' | 'replied' | 'archived') => {
    try {
      const res = await fetch(`/api/admin/messages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus, isRead: newStatus !== 'new' }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', message: `Message status set to ${newStatus}` }));
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus, isRead: newStatus !== 'new' } : m))
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus, isRead: newStatus !== 'new' } : null));
        }
        loadStats();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update message status' }));
    }
  };

  const handleSaveStaffNotes = async () => {
    if (!selectedMessage) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/messages/${selectedMessage.id}/reply-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ staffNotes: staffNoteInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'success', message: 'Staff note recorded and status marked as Replied' }));
        setSelectedMessage((prev) =>
          prev
            ? {
                ...prev,
                staffNotes: staffNoteInput.trim(),
                status: 'replied',
                isRead: true,
                repliedAt: new Date().toISOString(),
              }
            : null
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selectedMessage.id
              ? {
                  ...m,
                  staffNotes: staffNoteInput.trim(),
                  status: 'replied',
                  isRead: true,
                  repliedAt: new Date().toISOString(),
                }
              : m
          )
        );
        loadStats();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to record staff note' }));
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this message record?')) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addToast({ type: 'info', message: 'Message record removed' }));
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
        loadStats();
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete message' }));
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    dispatch(addToast({ type: 'success', message: 'Email copied to clipboard' }));
  };

  const getStatusBadge = (status: string, isRead: boolean) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            New
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Read
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Replied
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            <span>Customer Inquiries & Messages</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming inquiries from the storefront contact form, audit customer questions, and record resolution notes.
          </p>
        </div>

        <button
          onClick={() => {
            loadMessages();
            loadStats();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Total Inquiries</div>
          <div className="text-2xl font-extrabold text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-500">Stored in MongoDB</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Unread / Action Required
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{stats.unread}</div>
          <div className="text-[10px] text-slate-500">Pending staff review</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-emerald-400 font-semibold">Replied & Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-400">{stats.byStatus.replied}</div>
          <div className="text-[10px] text-slate-500">Documented by staff</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Archived</div>
          <div className="text-2xl font-extrabold text-slate-300">{stats.byStatus.archived}</div>
          <div className="text-[10px] text-slate-500">Historical records</div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: 'All', count: stats.total },
              { key: 'unread', label: 'Unread', count: stats.unread },
              { key: 'new', label: 'New', count: stats.byStatus.new },
              { key: 'read', label: 'Read', count: stats.byStatus.read },
              { key: 'replied', label: 'Replied', count: stats.byStatus.replied },
              { key: 'archived', label: 'Archived', count: stats.byStatus.archived },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === t.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === t.key ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, topic..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 3. Messages List & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className={`${selectedMessage ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3`}>
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading messages from store...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <MailOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No messages found</h3>
              <p className="text-xs text-slate-500">
                {searchQuery ? 'Try adjusting your search criteria.' : 'No customer inquiries in this folder.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  selectedMessage?.id === msg.id
                    ? 'bg-slate-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                    : msg.isRead
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    : 'bg-slate-900 border-amber-500/40 hover:border-amber-500/70 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unread" />
                    )}
                    <span className="text-xs font-bold text-slate-100">{msg.name}</span>
                    <span className="text-[11px] text-slate-400">({msg.email})</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(msg.status, msg.isRead)}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    {msg.department && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {msg.department}
                      </span>
                    )}
                    <span className="truncate">{msg.subject}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {msg.staffNotes && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-medium">Staff Note:</span>
                    <span className="truncate text-slate-300">{msg.staffNotes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected Message Detail Drawer / Card */}
        {selectedMessage && (
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 sticky top-6 shadow-xl">
            {/* Topbar of Drawer */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedMessage.status, selectedMessage.isRead)}
                  <span className="text-[11px] font-mono text-slate-500">
                    REF: {selectedMessage.id}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">{selectedMessage.subject}</h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Delete Inquiry Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-bold text-white">{selectedMessage.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Address:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-400">{selectedMessage.email}</span>
                  <button
                    onClick={() => handleCopyEmail(selectedMessage.email)}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {selectedMessage.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-white">{selectedMessage.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department / Type:</span>
                <span className="text-slate-300 font-medium">{selectedMessage.department || 'General Support'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Submitted Timestamp:</span>
                <span className="text-slate-300">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Inquiry Message
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>
            </div>

            {/* Quick Status Setter */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">Change Status:</span>
              <div className="flex items-center gap-1.5">
                {(['new', 'read', 'replied', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedMessage.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition cursor-pointer ${
                      selectedMessage.status === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Internal Note & Follow-up Resolution */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Internal Staff Resolution Notes</span>
                </label>
                {selectedMessage.repliedAt && (
                  <span className="text-[10px] text-slate-500">
                    Logged: {new Date(selectedMessage.repliedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={staffNoteInput}
                onChange={(e) => setStaffNoteInput(e.target.value)}
                placeholder="Log internal action taken (e.g. 'Phoned customer at 3:15 PM and confirmed courier dispatch' or 'Approved corporate quote')."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
              <button
                onClick={handleSaveStaffNotes}
                disabled={savingNote}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingNote ? (
                  <span>Saving Note...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Resolution & Mark as Replied</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesAdminPage;
