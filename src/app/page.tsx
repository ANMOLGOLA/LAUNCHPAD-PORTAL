'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldAlert, Users, MessageSquare, Calendar, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function checkAuthAndFetchData() {
      try {
        const res = await fetch('/api/claim/status', {
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('claim_token') || '') }
        });
        const data = await res.json();
        
        if (data.success && data.claim) {
          router.push('/claim');
          return;
        }

        // Fetch announcements for the homepage preview
        const annRes = await fetch('/api/announcements');
        const annData = await annRes.json();
        if (annData.success) {
          setAnnouncements(annData.announcements.slice(0, 2)); // Show top 2
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkAuthAndFetchData();
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
        localStorage.setItem('launchpad_session', data.sessionToken);
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
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center py-16 px-6">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider uppercase mb-6 ring-1 ring-blue-500/20">
            Community Hub Portal
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Community Hub</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Connect with peers, participate in exclusive discussions, track your event credentials, and stay updated on the latest opportunities—all in one centralized platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Community Highlights */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-xl border ">
                <div className="p-6 pt-0 ">
                  <div className="w-12 h-12 mx-auto bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold">Seamless Networking</h3>
                  <p className="text-sm text-neutral-500">Discover and connect with like-minded members via the public directory.</p>
                </div>
              </div>

              <div className="rounded-xl border ">
                <div className="p-6 pt-0 ">
                  <div className="w-12 h-12 mx-auto bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold">Rich Discussions</h3>
                  <p className="text-sm text-neutral-500">Share wins, ask questions, and collaborate on the community board.</p>
                </div>
              </div>

              <div className="rounded-xl border ">
                <div className="p-6 pt-0 ">
                  <div className="w-12 h-12 mx-auto bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold">Exclusive Updates</h3>
                  <p className="text-sm text-neutral-500">Be the first to know about upcoming events, workshops, and credentials.</p>
                </div>
              </div>
            </div>

            {/* Announcements Preview */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Latest Announcements</h3>
                <span className="text-xs text-neutral-500">Sign in to view all</span>
              </div>
              
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-neutral-500 text-sm italic">No recent announcements.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="border-l-2 border-blue-500 pl-4 py-1">
                      <h4 className="font-semibold text-sm">{ann.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Area */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border ">
              <div className="p-6 pb-2 ">
                <h3 className="font-semibold tracking-tight ">Enter Portal</h3>
              </div>
              <div className="p-6 pt-0 ">
                <p className="text-sm text-neutral-400 text-center">
                  Sign in with your registered Google account to access the community hub and claim your credentials.
                </p>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-white hover:bg-neutral-200 text-neutral-900 font-bold py-6 rounded-xl text-base flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-neutral-900" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {message && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-xs flex gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <div>{message} Redirecting...</div>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-xs flex gap-2">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
