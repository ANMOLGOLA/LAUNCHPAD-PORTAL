"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, BellRing } from 'lucide-react';

export default function EventsAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements & Events</h1>
            <p className="text-neutral-400 mt-2">Exclusive updates, workshops, and opportunities.</p>
          </div>
          <button onClick={() => router.push('/claim')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">Back to Dashboard</button>
        </div>

        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No new announcements right now.
            </div>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className={`bg-neutral-900 border-neutral-800 relative overflow-hidden ${ann.priority === 'high' ? 'ring-1 ring-blue-500/50' : ''}`}>
                {ann.priority === 'high' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 flex items-start justify-end p-3 rounded-bl-full">
                    <BellRing className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                <div className="p-6 pb-2">
                  <h3 className="font-semibold tracking-tight ">
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
                <div className="p-6 pt-0">
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
