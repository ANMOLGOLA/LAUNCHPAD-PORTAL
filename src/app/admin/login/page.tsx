'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/admin/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        // Store our own admin JWT for subsequent calls
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_email', data.email);
        router.push('/admin');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      setError(e.message ?? 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
        {/* Subtle accent bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Coordinator Login</h2>
          <p className="text-sm text-slate-500">
            Sign in with your authorized Google account to access the dashboard.
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <>
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3.5 text-xs flex gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
