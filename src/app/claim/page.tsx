'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle2, Circle, Clock, ExternalLink, FileDown, Lock, MailCheck, RotateCcw } from 'lucide-react';

interface ClaimStatus {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'verified' | 'unlocked' | 'revoked';
  email_verified_at?: string;
  task_started_at?: string;
  task_completed_at?: string;
  certificate_id?: string;
}

interface EventStatus {
  id: string;
  name: string;
  description: string;
  event_date: string;
  task_url: string;
  task_instructions: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimStatus | null>(null);
  const [event, setEvent] = useState<EventStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    const token = localStorage.getItem('claim_token');
    if (!token) {
      router.push('/verify');
      return;
    }

    try {
      const res = await fetch('/api/claim/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClaim(data.claim);
        setEvent(data.event);
      } else {
        setError(data.message || 'Session expired.');
        localStorage.removeItem('claim_token');
        router.push('/');
      }
    } catch (e) {
      setError('Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto poll when user refocuses tab (returned from completing Google Form/Task)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-slate-500 font-medium">Retrieving credential status...</p>
      </div>
    );
  }

  if (error || !claim || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Claim Error</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Session is invalid.'}</p>
          <button onClick={() => router.push('/')} className="btn btn-primary w-full">Return Home</button>
        </div>
      </div>
    );
  }

  const isTaskCompleted = claim.status === 'unlocked' || !!claim.task_completed_at;
  const token = localStorage.getItem('claim_token') || '';

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">Welcome, {claim.name || claim.email.split('@')[0]}</h1>
          <p className="text-sm text-slate-500">Verified participant for {event.name}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('claim_token');
            router.push('/');
          }}
          className="text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition border border-rose-100"
        >
          Sign Out / Switch Account
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
      
        {/* Left Column: Progress Stepper */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Your Claim Stepper</h3>
          
          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            
            {/* Step 1: Email Verification */}
            <div className="flex gap-4 relative">
              <div className="w-6.5 h-6.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs z-10 flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Verify Email
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">Done</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{claim.email}</p>
              </div>
            </div>

            {/* Step 2: Task Completion */}
            <div className="flex gap-4 relative">
              <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs z-10 flex-shrink-0 ${
                isTaskCompleted ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
              }`}>
                {isTaskCompleted ? '✓' : '2'}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Complete Task
                  {!isTaskCompleted && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Pending</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Click and view the event link</p>
              </div>
            </div>

            {/* Step 3: Certificate Issuance */}
            <div className="flex gap-4 relative">
              <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-xs z-10 flex-shrink-0 ${
                isTaskCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                3
              </div>
              <div>
                <h4 className={`text-sm font-semibold mt-0.5 ${isTaskCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                  Download Credentials
                </h4>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Instructions info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600">
          <span className="font-bold block mb-1">Need help?</span>
          Make sure to click the active task button on the right. Once the task tab opens, return here. The portal will automatically refresh and unlock your certificate immediately.
        </div>
      </div>

      {/* Right Column: Dashboard Interactive Area */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Step 2 Actions Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display text-slate-800 mb-2">
            Step 2: Mandatory Task Link
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            The coordinator requires you to visit the following event survey or document before claiming your credentials.
          </p>

          {isTaskCompleted ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold block">Task Completed!</span>
                Your visit to the coordinator's link has been registered. Your certificate is now generated and unlocked.
              </div>
            </div>
          ) : (
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-6 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-2">Instructions:</p>
              <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                {event.task_instructions || "Click the 'Start Task' button below. This will open the required link in a new browser tab. Your unlock status updates instantly upon click."}
              </p>
              <a
                href={`/t/${token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition shadow-sm hover:shadow active:scale-[0.98]"
              >
                Start Task <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Step 3 Certificate Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display text-slate-800 mb-2">
            Step 3: Retrieve Certificate
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Generate and download your verified credential file.
          </p>

          {isTaskCompleted ? (
            <div className="space-y-6">
              {/* PDF Embed / Visual preview box */}
              <div className="border border-slate-200 rounded-xl bg-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden aspect-[4/3] max-w-lg mx-auto shadow-inner">
                <Award className="w-16 h-16 text-blue-600 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-slate-700">Official Certificate Ready</p>
                <p className="text-xs text-slate-400 mt-1">ID: {claim.certificate_id}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <a
                  href={`/api/claim/download?token=${token}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <FileDown className="w-4 h-4" /> Download PDF (Clean)
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6 opacity-85">
              {/* Locked Preview Certificate Box */}
              <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 aspect-[4/3] max-w-lg mx-auto relative">
                <Lock className="w-12 h-12 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-500">Certificate Locked</p>
                <p className="text-xs text-slate-400 mt-1 text-center max-w-xs leading-relaxed">
                  Complete the mandatory task link above to release the clean high-resolution credential file.
                </p>
                
                {/* Preview Link */}
                <a 
                  href={`/api/claim/download?token=${token}&preview=true`}
                  className="mt-6 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" /> Download Watermarked Preview PDF
                </a>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}

// Simple fallback component
function ShieldAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
