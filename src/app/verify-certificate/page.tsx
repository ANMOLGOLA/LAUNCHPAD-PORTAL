'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search } from 'lucide-react';

export default function VerifyCertificatePage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify-certificate/${encodeURIComponent(certId.trim())}`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Verify Certificate</h2>
          <p className="text-sm text-slate-500">
            Enter a certificate identification key to verify its current validation status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="certId" className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Certificate Credential ID
            </label>
            <div className="relative">
              <input
                id="certId"
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                placeholder="e.g. TLP-2026-XXXXXX"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
          >
            Verify Credential
          </button>
        </form>

      </div>
    </div>
  );
}
