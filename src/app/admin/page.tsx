'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Calendar, Eye, Users, FileText, CheckCircle2, 
  Settings, LogOut, ArrowRight, ShieldCheck, Activity, Search
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  event_date: string;
  status: 'draft' | 'active' | 'closed';
  task_url: string;
  verification_mode: string;
}

interface AuditLog {
  id: string;
  actor?: string;
  action: string;
  target?: string;
  ip?: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  
  // Create Event Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    slug: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'active' | 'closed',
    task_url: '',
    verification_mode: 'click_detection'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const email = localStorage.getItem('admin_email');
    if (!token || !email) {
      router.push('/admin/login');
      return;
    }
    setAdminEmail(email);

    async function fetchData() {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch events
        const eventsRes = await fetch('/api/admin/events', { headers });
        const eventsData = await eventsRes.json();
        if (eventsData.success) {
          setEvents(eventsData.events);
        } else if (eventsRes.status === 401) {
          handleLogout();
          return;
        }

        // Fetch audit logs
        const logsRes = await fetch('/api/admin/audit-logs', { headers });
        const logsData = await logsRes.json();
        if (logsData.success) {
          setLogs(logsData.logs.slice(0, 10)); // Display latest 10 logs
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    router.push('/admin/login');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });
      const data = await res.json();

      if (data.success) {
        setEvents([data.event, ...events]);
        setShowCreateModal(false);
        setNewEvent({
          name: '',
          slug: '',
          description: '',
          event_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          task_url: '',
          verification_mode: 'click_detection'
        });
      } else {
        setCreateError(data.message || 'Failed to create event');
      }
    } catch (err) {
      setCreateError('Connection failed.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (newEvent.name) {
      const suggestedSlug = newEvent.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setNewEvent(prev => ({ ...prev, slug: suggestedSlug }));
    }
  }, [newEvent.name]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Coordinator Control Console
          </div>
          <h1 className="text-3xl font-bold font-display text-slate-900 mt-1">
            Program Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{adminEmail}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create New Event
          </button>
          <button
            onClick={handleLogout}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Events</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{events.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase">Active Event</div>
          <div className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
            {events.find(e => e.status === 'active') ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {events.find(e => e.status === 'active')?.name}
              </>
            ) : (
              <span className="text-slate-400 font-normal">None</span>
            )}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase">System Status</div>
          <div className="text-sm font-semibold text-blue-600 mt-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Operational
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase">Environment Mode</div>
          <div className="text-sm font-semibold text-amber-600 mt-2">
            {process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ? 'Offline Sandbox (Mock)' : 'Supabase Production'}
          </div>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Monthly Certification Events</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {events.length} Events
          </span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-sm">No Events Scaffolding Found</p>
            <p className="text-xs max-w-xs mx-auto mt-1">Create your first monthly event to begin receiving and issuing participation certificates.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                  <th className="px-6 py-3">Event Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Verification Mode</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{event.name}</div>
                      <div className="text-xs text-slate-400">/{event.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        event.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : event.status === 'closed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {event.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(event.event_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {event.verification_mode}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className="bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold py-1.5 px-3 rounded-lg text-xs inline-flex items-center gap-1 border border-slate-200 hover:border-blue-100 transition"
                      >
                        <Settings className="w-3.5 h-3.5" /> Manage <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Audit Log */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" /> Security Audit Log
          </h2>
          <span className="text-xs text-slate-500">Latest 10 logs</span>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No system actions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-xs">
                <div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-2">{log.action}</span>
                  <span className="text-slate-500">Actor: </span>
                  <span className="font-semibold text-slate-600">{log.actor || 'System'}</span>
                  {log.target && (
                    <>
                      <span className="text-slate-400"> → Target: </span>
                      <span className="text-slate-600 font-mono">{log.target}</span>
                    </>
                  )}
                </div>
                <div className="text-slate-400 flex items-center gap-2">
                  <span>IP: {log.ip || '127.0.0.1'}</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Create Certification Event</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flutter Fundamentals Boot Camp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="flutter-fundamentals"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition font-mono"
                    value={newEvent.slug}
                    onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  placeholder="Summarize the event goals and curriculum details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition h-20 resize-none"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as any })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Verification Mode</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                    value={newEvent.verification_mode}
                    onChange={(e) => setNewEvent({ ...newEvent, verification_mode: e.target.value })}
                  >
                    <option value="click_detection">Click Link Tracking</option>
                    <option value="return_confirmation">Return Confirmation</option>
                    <option value="dwell_time">Dwell Time Detection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tracked Link / Task URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://forms.gle/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  value={newEvent.task_url}
                  onChange={(e) => setNewEvent({ ...newEvent, task_url: e.target.value })}
                />
              </div>

              {createError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {createLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple loader helper
function Loader2({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
