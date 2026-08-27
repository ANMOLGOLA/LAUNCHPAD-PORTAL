'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, ShieldAlert } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface ActiveEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    async function fetchActiveEvent() {
      try {
        // Query active event from local mock or database via status endpoint
        const res = await fetch('/api/claim/status', {
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('claim_token') || '') }
        });
        const data = await res.json();
        
        // If they already have an active verified/unlocked session, redirect them to claim dashboard!
        if (data.success && data.claim && (data.claim.status === 'verified' || data.claim.status === 'unlocked')) {
          router.push('/claim');
          return;
        }

        // Fetch active event details
        const eventRes = await fetch('/api/events/active');
        const eventData = await eventRes.json();
        if (eventData.success && eventData.event) {
          setActiveEvent(eventData.event);
        }
      } catch (e) {
        console.error('Failed to load active event:', e);
      } finally {
        setLoadingEvent(false);
      }
    }
    fetchActiveEvent();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/firebase-participant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('claim_token', data.sessionToken);
        setMessage(data.message);
        router.push('/claim');
      } else {
        setError(data.message || 'Verification failed. Are you on the participant list?');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In popup was closed before finishing.');
      } else {
        setError('Authentication failed. Please verify your connection or try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="text-center mb-10">
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
          Student Ambassador Event Portal
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-900 mt-4 mb-4">
          Claim Your Event Credentials
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Verify your attendee email address, complete the event feedback or survey task, and immediately download your certificate.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Left Side: Active Event Card */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            Active Certification Event
          </h2>

          {loadingEvent ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          ) : activeEvent ? (
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">
                {activeEvent.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Event Date: {new Date(activeEvent.event_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                {activeEvent.description || 'No description provided for this event.'}
              </p>
              
              <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-xs text-blue-800">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">Verification Flow</span>
                  Complete email verification → Click assigned task link → Download signed PDF.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No Active Events Available</p>
              <p className="text-xs">There are no monthly certification events open for claims right now.</p>
            </div>
          )}
        </div>

        {/* Right Side: Claim Form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Start Your Claim</h3>
          
          <div className="space-y-6 mt-6">
            <p className="text-sm text-slate-600">
              Please sign in with your student Google account to verify your identity and check if you are eligible to claim a certificate for this event.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading || !activeEvent}
              className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-3 shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          {message && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs flex gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>{message} Redirecting to your dashboard...</div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs flex gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
