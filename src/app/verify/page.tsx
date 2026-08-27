'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();

      if (data.success && data.sessionToken) {
        setSuccess(true);
        localStorage.setItem('claim_token', data.sessionToken);
        localStorage.setItem('claim_email', email);
        
        // Redirect to claim portal after 1.5 seconds
        setTimeout(() => {
          router.push('/claim');
        }, 1500);
      } else {
        setError(data.message || 'Verification failed. Please check the code and try again.');
      }
    } catch (err) {
      setError('Connection failed. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to start
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Verify Your Email</h2>
          <p className="text-sm text-slate-500">
            We sent a 6-digit verification code to <span className="font-semibold text-slate-700 block mt-1">{email || 'your email address'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-xs font-semibold uppercase text-slate-500 mb-2 text-center">
              Verification Code (OTP)
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-center text-2xl font-bold tracking-[8px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : success ? (
              'Verified ✓'
            ) : (
              'Verify & Access Portal'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs text-center animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs text-center animate-fade-in">
            Success! Loading claim page...
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
