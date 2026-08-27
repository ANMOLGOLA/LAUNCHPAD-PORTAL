'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, FileText, Settings, Users, CheckCircle2, 
  Trash2, ShieldCheck, Download, Upload, Loader2, Play, Lock, Check,
  Search, FileSpreadsheet, Eye, Plus, ShieldAlert
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  event_date: string;
  status: 'draft' | 'active' | 'closed';
  task_url: string;
  task_instructions?: string;
  verification_mode: 'click_detection' | 'return_confirmation' | 'dwell_time';
  template_path?: string;
  template_fields?: any;
}

interface Participant {
  id: string;
  email: string;
  name?: string;
}

interface Claim {
  id: string;
  email: string;
  participant_id: string;
  status: 'pending' | 'verified' | 'unlocked' | 'revoked';
  email_verified_at?: string;
  task_started_at?: string;
  task_completed_at?: string;
  certificate_id?: string;
  certificate_generated_at?: string;
}

export default function EventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<'settings' | 'allowlist' | 'claims'>('settings');
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Forms / Actions state
  const [eventForm, setEventForm] = useState<Omit<Event, 'id'>>({
    name: '',
    slug: '',
    description: '',
    event_date: '',
    status: 'draft',
    task_url: '',
    task_instructions: '',
    verification_mode: 'click_detection',
    template_path: '',
    template_fields: {
      name: { x: 50, y: 50, size: 36, color: '#1a1a1a' },
      date: { x: 50, y: 70, size: 16, color: '#4a4a4a' }
    }
  } as any);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Allowlist single add state
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // CSV Bulk Add State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvRows, setParsedCsvRows] = useState<Array<{ email: string; name: string }>>([]);

  const [activePlacer, setActivePlacer] = useState<'none' | 'name' | 'date'>('none');
  const [bulkUploading, setBulkUploading] = useState(false);

  // Search/Filters
  const [participantSearch, setParticipantSearch] = useState('');
  const [claimSearch, setClaimSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setAdminToken(token);

    async function fetchEventDetails() {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch event metadata
        const eventRes = await fetch(`/api/admin/events/${eventId}`, { headers });
        const eventData = await eventRes.json();
        if (eventData.success) {
          setEvent(eventData.event);
          setEventForm({
            name: eventData.event.name,
            slug: eventData.event.slug,
            description: eventData.event.description || '',
            event_date: eventData.event.event_date.split('T')[0],
            status: eventData.event.status,
            task_url: eventData.event.task_url,
            task_instructions: eventData.event.task_instructions || '',
            verification_mode: eventData.event.verification_mode,
            template_path: eventData.event.template_path || '',
            template_fields: eventData.event.template_fields || {
              name: { x: 50, y: 50, size: 36, color: '#1a1a1a' },
              date: { x: 50, y: 70, size: 16, color: '#4a4a4a' }
            }
          });
        } else {
          router.push('/admin');
          return;
        }

        // Fetch participants
        const participantsRes = await fetch(`/api/admin/participants?eventId=${eventId}`, { headers });
        const participantsData = await participantsRes.json();
        if (participantsData.success) {
          setParticipants(participantsData.participants);
        }

        // Fetch claims
        const claimsRes = await fetch(`/api/admin/claims?eventId=${eventId}`, { headers });
        const claimsData = await claimsRes.json();
        if (claimsData.success) {
          setClaims(claimsData.claims);
        }

      } catch (err) {
        console.error('Error fetching event data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, router]);

  // Update Event Handler
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateMessage(null);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(eventForm)
      });
      const data = await res.json();

      if (data.success) {
        setEvent(data.event);
        setUpdateMessage('Event configurations updated successfully!');
      } else {
        setUpdateError(data.message || 'Failed to update event details');
      }
    } catch (err) {
      setUpdateError('Network failure occurred.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Add Participant Handler
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail) return;
    setAddLoading(true);

    try {
      const res = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          eventId,
          email: singleEmail,
          name: singleName
        })
      });
      const data = await res.json();

      if (data.success) {
        setParticipants([data.participant, ...participants]);
        setSingleEmail('');
        setSingleName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  // Remove Participant Handler
  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the allowlist?')) return;

    try {
      const res = await fetch(`/api/admin/participants?id=${participantId}&eventId=${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();

      if (data.success) {
        setParticipants(participants.filter(p => p.id !== participantId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV File Upload Change Handler
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const rows: Array<{ email: string; name: string }> = [];

      // Check header format
      const hasHeader = lines[0].toLowerCase().includes('email');
      const startLine = hasHeader ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Try comma or semicolon as delimiter
        const delimiter = line.includes(';') ? ';' : ',';
        const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        
        // Find which column looks like an email address
        const emailIndex = parts.findIndex(p => p.includes('@') && p.includes('.'));
        
        if (emailIndex !== -1) {
          const email = parts[emailIndex];
          // Use the other column as name if available, otherwise leave blank
          const name = parts.length > 1 ? (emailIndex === 0 ? parts[1] : parts[0]) : '';
          
          rows.push({ email, name });
        }
      }
      setParsedCsvRows(rows);
    };
    reader.readAsText(file);
  };

  // CSV Bulk Upload Submission Handler
  const handleBulkUpload = async () => {
    if (parsedCsvRows.length === 0) return;
    setBulkUploading(true);

    try {
      const res = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          eventId,
          bulk: parsedCsvRows
        })
      });
      const data = await res.json();

      if (data.success) {
        setParticipants([...data.participants, ...participants]);
        setCsvFile(null);
        setParsedCsvRows([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBulkUploading(false);
    }
  };

  // Update Claim Status (Unlock / Revoke)
  const handleUpdateClaimStatus = async (claimId: string, status: 'unlocked' | 'revoked') => {
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ claimId, status })
      });
      const data = await res.json();

      if (data.success) {
        setClaims(claims.map(c => c.id === claimId ? { ...c, status: data.claim.status } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger PDF Certificate Preview Download
  const handleDownloadPreview = async (claim: Claim) => {
    if (!event || !adminToken) return;
    const recipientName = participants.find(p => p.email === claim.email)?.name || claim.email.split('@')[0];
    const certId = claim.certificate_id || `TLP-MOCK-${claim.id.substring(0, 8).toUpperCase()}`;

    try {
      const res = await fetch(
        `/api/admin/preview-certificate?recipientName=${encodeURIComponent(recipientName)}&eventName=${encodeURIComponent(event.name)}&eventDate=${encodeURIComponent(event.event_date)}&certId=${certId}&watermark=false${eventForm.template_path ? `&templatePath=${encodeURIComponent(eventForm.template_path)}` : ''}&templateFields=${encodeURIComponent(JSON.stringify(eventForm.template_fields))}`,
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      if (!res.ok) throw new Error('Failed to download certificate');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error downloading certificate.');
    }
  };

  // Trigger General Test Preview Template
  const handleDownloadTemplatePreview = async () => {
    if (!event) return;
    try {
      const res = await fetch(
        `/api/admin/preview-certificate?recipientName=John Doe&eventName=${encodeURIComponent(event.name)}&eventDate=${encodeURIComponent(event.event_date)}&watermark=true${eventForm.template_path ? `&templatePath=${encodeURIComponent(eventForm.template_path)}` : ''}`,
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      if (!res.ok) throw new Error('Failed to load preview');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Error loading certificate preview.');
    }
  };

  // Export claims as CSV file client-side
  const handleExportClaimsCSV = () => {
    if (claims.length === 0) return;
    
    // Headers
    const csvContent = [
      ['Email Address', 'Name', 'Status', 'Email Verified At', 'Task Clicked At', 'Credential ID', 'Generated At'].join(','),
      ...claims.map(c => {
        const participant = participants.find(p => p.email === c.email);
        return [
          `"${c.email}"`,
          `"${participant?.name || ''}"`,
          `"${c.status}"`,
          `"${c.email_verified_at ? new Date(c.email_verified_at).toLocaleString() : ''}"`,
          `"${c.task_completed_at ? new Date(c.task_completed_at).toLocaleString() : ''}"`,
          `"${c.certificate_id || ''}"`,
          `"${c.certificate_generated_at ? new Date(c.certificate_generated_at).toLocaleString() : ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `claims-export-${event?.slug || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering lists based on search params
  const filteredParticipants = participants.filter(p => 
    p.email.toLowerCase().includes(participantSearch.toLowerCase()) || 
    (p.name && p.name.toLowerCase().includes(participantSearch.toLowerCase()))
  );

  const filteredClaims = claims.filter(c => {
    const participant = participants.find(p => p.email === c.email);
    const searchString = claimSearch.toLowerCase();
    return (
      c.email.toLowerCase().includes(searchString) ||
      (participant?.name && participant.name.toLowerCase().includes(searchString)) ||
      (c.certificate_id && c.certificate_id.toLowerCase().includes(searchString)) ||
      c.status.toLowerCase().includes(searchString)
    );
  });

  if (loading || !event) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  // Quick statistics calculation
  const totalClaimsCount = claims.length;
  const verifiedCount = claims.filter(c => c.status === 'verified').length;
  const unlockedCount = claims.filter(c => c.status === 'unlocked').length;
  const revokedCount = claims.filter(c => c.status === 'revoked').length;
  const conversionRate = totalClaimsCount > 0 ? Math.round((unlockedCount / totalClaimsCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">{event.name}</h1>
            <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
              event.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {event.status}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">ID: {event.id}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplatePreview}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5" /> Preview PDF Template
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'settings' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" /> Event Configurations
        </button>
        <button
          onClick={() => setActiveTab('allowlist')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'allowlist' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Attendee Allowlist ({participants.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'claims' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Claims Monitoring ({claims.length})
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <form onSubmit={handleUpdateEvent} className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Edit Event Settings</h3>
            
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Event Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition font-mono"
                  value={eventForm.slug}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Event Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition h-24 resize-none"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active (Claims Open)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Verification Mode</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                  value={eventForm.verification_mode}
                  onChange={(e) => setEventForm({ ...eventForm, verification_mode: e.target.value as any })}
                >
                  <option value="click_detection">Click Link Tracking</option>
                  <option value="return_confirmation">Return Confirmation</option>
                  <option value="dwell_time">Dwell Time Detection</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mandatory Task / Redirect Link</label>
              <input
                type="url"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition"
                value={eventForm.task_url}
                onChange={(e) => setEventForm({ ...eventForm, task_url: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Task Instructions (Shown to Attendees)</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 transition h-20 resize-none"
                value={eventForm.task_instructions}
                onChange={(e) => setEventForm({ ...eventForm, task_instructions: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Certificate Template (Optional)</label>
              <p className="text-[11px] text-slate-500 mb-3">
                Upload a custom background image (1122x793 pixels recommended, Landscape). The system will automatically place the name, event name, and date in the center. If not provided, a default design will be used.
              </p>
              
              <div className="flex items-center gap-4">
                {eventForm.template_path ? (
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center">
                    <div className="text-xs font-semibold text-blue-800">Custom Template Active</div>
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/events/${eventId}/template`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${adminToken}` }
                          });
                          setEventForm({ ...eventForm, template_path: '' });
                          alert('Template cleared. Reverted to default design.');
                        } catch (err) {
                          alert('Error clearing template');
                        }
                      }}
                      className="text-[11px] bg-white border border-rose-200 text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                      Clear Template
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        try {
                          const res = await fetch(`/api/admin/events/${eventId}/template`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${adminToken}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (data.success) {
                            setEventForm({ ...eventForm, template_path: data.template_path });
                            alert('Custom template uploaded successfully!');
                          } else {
                            alert(data.message || 'Upload failed');
                          }
                        } catch (err) {
                          alert('Error uploading file');
                        }
                      }}
                      className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {updateMessage && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>{updateMessage}</div>
              </div>
            )}

            {updateError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs flex gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div>{updateError}</div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={updateLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {updateLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Smart Placer UI */}
          {eventForm.template_path && (
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Smart Template Placer</h3>
              <p className="text-sm text-slate-600 mb-4">Click on the certificate image below to position the fields. Changes are saved when you click &quot;Save Changes&quot; above.</p>
              
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActivePlacer(activePlacer === 'name' ? 'none' : 'name')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activePlacer === 'name' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {activePlacer === 'name' ? 'Click image to place Name...' : 'Position Name'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlacer(activePlacer === 'date' ? 'none' : 'date')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activePlacer === 'date' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {activePlacer === 'date' ? 'Click image to place Date...' : 'Position Date'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Name Font Size</label>
                    <span className="text-xs font-bold text-slate-700">{eventForm.template_fields?.name?.size || 36}px</span>
                  </div>
                  <input type="range" min="10" max="100" value={eventForm.template_fields?.name?.size || 36} onChange={(e) => setEventForm({...eventForm, template_fields: {...eventForm.template_fields, name: {...eventForm.template_fields?.name, size: parseInt(e.target.value)}}})} className="w-full accent-blue-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Date Font Size</label>
                    <span className="text-xs font-bold text-slate-700">{eventForm.template_fields?.date?.size || 16}px</span>
                  </div>
                  <input type="range" min="10" max="100" value={eventForm.template_fields?.date?.size || 16} onChange={(e) => setEventForm({...eventForm, template_fields: {...eventForm.template_fields, date: {...eventForm.template_fields?.date, size: parseInt(e.target.value)}}})} className="w-full accent-blue-600" />
                </div>
              </div>

              <div className={`relative border-2 rounded-xl overflow-hidden inline-block ${activePlacer !== 'none' ? 'border-blue-500 cursor-crosshair ring-4 ring-blue-500/20' : 'border-slate-200'}`}
                onClick={(e: any) => {
                  if (activePlacer === 'none') return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const xPercent = (e.clientX - rect.left) / rect.width * 100;
                  const yPercent = (e.clientY - rect.top) / rect.height * 100;
                  setEventForm({
                    ...eventForm,
                    template_fields: {
                      ...eventForm.template_fields,
                      [activePlacer]: {
                        ...eventForm.template_fields?.[activePlacer],
                        x: xPercent,
                        y: yPercent
                      }
                    }
                  });
                  setActivePlacer('none');
                }}
              >
                <img src={eventForm.template_path} alt="Template Preview" className="max-w-full h-auto block" />
                
                {eventForm.template_fields?.name && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ left: `${eventForm.template_fields.name.x}%`, top: `${eventForm.template_fields.name.y}%` }}>
                    <div className="font-bold text-slate-900 border-2 border-blue-500 border-dashed px-3 py-1 rounded whitespace-nowrap bg-white/50 backdrop-blur-sm shadow-sm" style={{ fontSize: `${Math.max(12, eventForm.template_fields.name.size / 2.5)}px` }}>
                      [John Doe]
                    </div>
                  </div>
                )}
                
                {eventForm.template_fields?.date && (
                  <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ left: `${eventForm.template_fields.date.x}%`, top: `${eventForm.template_fields.date.y}%` }}>
                    <div className="font-bold text-slate-900 border-2 border-emerald-500 border-dashed px-3 py-1 rounded whitespace-nowrap bg-white/50 backdrop-blur-sm shadow-sm" style={{ fontSize: `${Math.max(10, eventForm.template_fields.date.size / 2.5)}px` }}>
                      [August 24, 2026]
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Quick tips card */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3">Ambassador Tip</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Set status to <strong>Active</strong> to open claims for attendees. When active, any email on the allowlist will be able to request an OTP and initiate their claim.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed mt-2">
                Only one event can be <strong>Active</strong> at any time. Activating this event will close any other active monthly event.
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2">Claim Stepper Flow</h4>
              <div className="space-y-2 text-xs text-slate-500 mt-3">
                <div className="flex gap-2 items-start">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                  <span><strong>Verify Email</strong>: OTP authentication matches allowed participant list.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                  <span><strong>Redirect Task</strong>: Click tracked URL (survey, feedback) recording click.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">3</span>
                  <span><strong>Download PDF</strong>: Dynamic QR code is compiled and clean PDF is issued.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allowlist Tab */}
      {activeTab === 'allowlist' && (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Allowlist Manager Table */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="font-bold text-slate-900">Allowed Participant Emails</h3>
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Search email/name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No participants found on the allowlist.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200 sticky top-0">
                      <th className="px-6 py-3">Attendee Email</th>
                      <th className="px-6 py-3">Attendee Name</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3 font-mono text-slate-700">{p.email}</td>
                        <td className="px-6 py-3 font-medium text-slate-800">{p.name || <span className="text-slate-400 italic">No name provided</span>}</td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleRemoveParticipant(p.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition inline-flex items-center gap-1"
                            title="Remove from Allowlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Side Addition Panels */}
          <div className="space-y-6">
            {/* Add single participant */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" /> Add Single Attendee
              </h4>
              <form onSubmit={handleAddParticipant} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="attendee@university.edu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addLoading || !singleEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {addLoading ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : 'Add Participant'}
                </button>
              </form>
            </div>

            {/* CSV Import */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" /> CSV Allowlist Import
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Upload a raw comma-separated CSV with email addresses in the first column, and names (optional) in the second column.
              </p>

              <div className="space-y-3">
                {!csvFile ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition relative">
                    <input
                      type="file"
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleCsvChange}
                    />
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-600 block">
                      Select CSV File
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">.csv format only</span>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          {csvFile.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Ready to import {parsedCsvRows.length} attendees
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setCsvFile(null);
                        setParsedCsvRows([]);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Change CSV file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {parsedCsvRows.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Parsed {parsedCsvRows.length} attendees
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Click upload to save.</span>
                    
                    <button
                      onClick={handleBulkUpload}
                      disabled={bulkUploading}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      {bulkUploading ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : 'Confirm Bulk Import'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Claims Dashboard Metrics bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200 text-center">
            <div className="bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Claims Initiated</span>
              <span className="block text-xl font-extrabold text-slate-900 mt-1">{totalClaimsCount}</span>
            </div>
            <div className="bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Verified</span>
              <span className="block text-xl font-extrabold text-blue-600 mt-1">{verifiedCount}</span>
            </div>
            <div className="bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Unlocked (PDF Active)</span>
              <span className="block text-xl font-extrabold text-emerald-600 mt-1">{unlockedCount}</span>
            </div>
            <div className="bg-slate-50/50 p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Task Conversion Rate</span>
              <span className="block text-xl font-extrabold text-slate-900 mt-1">{conversionRate}%</span>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/30">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search email/id/status..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={handleExportClaimsCSV}
              disabled={claims.length === 0}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition ml-auto disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export Claims CSV
            </button>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No claim records matches filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="px-6 py-3">Attendee</th>
                    <th className="px-6 py-3">Authentication Status</th>
                    <th className="px-6 py-3">Mandatory Task redirect</th>
                    <th className="px-6 py-3">Certificate Credential</th>
                    <th className="px-6 py-3 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredClaims.map((c) => {
                    const participant = participants.find(p => p.email === c.email);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5">
                          <span className="font-bold text-slate-800 block">
                            {participant?.name || <span className="text-slate-400 italic">Unknown Name</span>}
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">{c.email}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'unlocked'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'verified'
                              ? 'bg-blue-50 text-blue-700'
                              : c.status === 'revoked'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {c.status}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1">
                            Verified: {c.email_verified_at ? new Date(c.email_verified_at).toLocaleDateString() : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {c.task_completed_at ? (
                            <div>
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {new Date(c.task_completed_at).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Not Clicked</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {c.certificate_id ? (
                            <div>
                              <span className="font-mono font-bold text-slate-800">{c.certificate_id}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Issued: {c.certificate_generated_at ? new Date(c.certificate_generated_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Locked</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-1.5">
                          {c.status !== 'unlocked' && c.status !== 'revoked' && (
                            <button
                              onClick={() => handleUpdateClaimStatus(c.id, 'unlocked')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-1 px-2.5 rounded text-[10px] inline-flex items-center gap-0.5 border border-emerald-100 transition"
                              title="Override stepper task check and issue certificate"
                            >
                              <Play className="w-2.5 h-2.5" /> Force Unlock
                            </button>
                          )}
                          
                          {c.status === 'unlocked' && (
                            <>
                              <button
                                onClick={() => handleDownloadPreview(c)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-1 px-2.5 rounded text-[10px] inline-flex items-center gap-0.5 border border-slate-200 transition"
                                title="Download the attendee's active certificate PDF"
                              >
                                <Download className="w-2.5 h-2.5" /> PDF
                              </button>
                              <button
                                onClick={() => handleUpdateClaimStatus(c.id, 'revoked')}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-1 px-2.5 rounded text-[10px] inline-flex items-center gap-0.5 border border-rose-100 transition"
                                title="Revoke Issued Certificate"
                              >
                                <Lock className="w-2.5 h-2.5" /> Revoke
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
