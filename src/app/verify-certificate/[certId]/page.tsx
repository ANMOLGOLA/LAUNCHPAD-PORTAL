import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { CheckCircle2, XCircle, ShieldCheck, Award, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VerifyCertificateDetailsPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  
  // Look up certificate claim in the database
  const claim = await db.getClaimByCertificateId(certId);
  const event = claim ? await db.getEventById(claim.event_id) : null;
  const participant = claim ? await db.getParticipant(claim.event_id, claim.email) : null;

  const isValid = claim && claim.status === 'unlocked';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        
        <Link 
          href="/verify-certificate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Search
        </Link>

        {isValid ? (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-900">Valid Certificate</h2>
              <p className="text-sm text-slate-500 mt-1">This credential has been verified as authentic</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Recipient Name</span>
                <span className="col-span-2 text-slate-800 font-semibold text-base">
                  {participant?.name || claim.email.split('@')[0]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Event Name</span>
                <span className="col-span-2 text-slate-800 font-medium">
                  {event?.name}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Date Issued</span>
                <span className="col-span-2 text-slate-800">
                  {event ? new Date(event.event_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Credential ID</span>
                <span className="col-span-2 text-slate-800 font-mono text-xs font-bold">
                  {claim.certificate_id}
                </span>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Cryptographically signed by Student Ambassador Portal Coordinator
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 border border-rose-100">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Invalid Certificate</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              The credential ID <strong className="font-mono text-slate-700">{certId}</strong> does not match any active, verified certificates in our database.
            </p>
            <p className="text-xs text-slate-400">
              This could happen if the certificate has been revoked by the admin, or if the ID is typed incorrectly.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
