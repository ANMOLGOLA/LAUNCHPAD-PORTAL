import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const activeEvent = await db.getActiveEvent();
    if (!activeEvent) {
      return NextResponse.json({ success: false, message: 'No active event found' }, { status: 404 });
    }

    const claim = await db.getClaimByEmail(activeEvent.id, email);
    if (!claim) {
      return NextResponse.json({ success: false, message: 'Invalid code or verification expired' }, { status: 400 });
    }

    // Verify OTP code and expiration
    const isExpired = claim.otp_expires_at ? new Date() > new Date(claim.otp_expires_at) : true;
    if (claim.otp_code !== otp || isExpired) {
      // Log failed attempt
      await db.createAuditLog({
        action: 'OTP_VERIFICATION_FAILED',
        target: email,
        meta: { event_id: activeEvent.id, reason: isExpired ? 'expired' : 'mismatch' },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.json({ success: false, message: 'Invalid code or verification expired' }, { status: 400 });
    }

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Update claim records
    await db.updateClaimById(claim.id, {
      otp_code: undefined, // Clear OTP
      otp_expires_at: undefined,
      email_verified_at: new Date().toISOString(),
      session_token: sessionToken,
      status: claim.status === 'pending' ? 'verified' : claim.status
    });

    // Write successful audit log
    await db.createAuditLog({
      action: 'OTP_VERIFIED',
      target: email,
      meta: { event_id: activeEvent.id, claim_id: claim.id },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      email: claim.email,
      status: claim.status
    });

  } catch (error: any) {
    console.error('Error in verify-otp API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
