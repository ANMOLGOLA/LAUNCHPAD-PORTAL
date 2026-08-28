"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, BellRing, ArrowRight } from 'lucide-react';

export default function EventsAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/announcements').then(res => res.json()),
      fetch('/api/events/active').then(res => res.json())
    ])
    .then(([annData, eventData]) => {
      if (annData.success) setAnnouncements(annData.announcements);
      if (eventData.success) setActiveEvent(eventData.event);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleRegister = async () => {
    if (!activeEvent) return;
    setRegistering(true);
    try {
      const token = localStorage.getItem('launchpad_session');
      if (!token) {
        alert("Please login first.");
        return;
      }
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: activeEvent.id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Successfully registered for the event!");
        // Refresh page or update state to show registered status
      } else {
        alert(data.message || "Failed to register");
      }
    } catch (e) {
      alert("Error registering");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events & Announcements</h1>
            <p className="text-neutral-400 mt-2">Discover upcoming opportunities and community updates.</p>
          </div>
          <button onClick={() => router.push('/claim')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">
            Back to Dashboard
          </button>
        </div>

        {activeEvent && (
          <div className="rounded-xl border bg-gradient-to-br from-blue-900/40 to-neutral-900 border-blue-800/50 p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
              <Calendar className="w-32 h-32 text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 mb-4">
                Upcoming Event
              </div>
              <h2 className="text-2xl font-bold mb-2">{activeEvent.name}</h2>
              <p className="text-neutral-300 max-w-2xl mb-6">{activeEvent.description || "Join us for our next community event! Participate, complete tasks, and earn your verified credential."}</p>
              
              <div className="flex items-center gap-4 text-sm text-blue-300 font-medium mb-8">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {new Date(activeEvent.event_date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleRegister} 
                  disabled={registering}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-lg shadow-blue-900/20"
                >
                  {registering ? 'Registering...' : 'Register Now'} <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-8">
          <h2 className="text-xl font-bold mb-6">Recent Announcements</h2>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800">
                No new announcements right now.
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className={`rounded-xl border bg-neutral-900 border-neutral-800 relative overflow-hidden ${ann.priority === 'high' ? 'ring-1 ring-blue-500/50' : ''}`}>
                  {ann.priority === 'high' && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 flex items-start justify-end p-3 rounded-bl-full">
                      <BellRing className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                  <div className="p-6 pb-2">
                    <h3 className="font-semibold tracking-tight text-lg">
                      {ann.title}
                    </h3>
                    <div className="flex gap-4 text-xs text-neutral-500 mt-2">
                      <span>Posted {new Date(ann.created_at).toLocaleDateString()}</span>
                      {ann.event_date && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Calendar className="w-3 h-3" /> Event: {new Date(ann.event_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 pt-0 mt-3">
                    <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {ann.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
