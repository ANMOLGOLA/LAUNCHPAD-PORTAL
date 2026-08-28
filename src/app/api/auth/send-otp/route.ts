import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Invalid email address' }, { status: 400 });
    }

    // 1. Fetch active event
    const activeEvent = await db.getActiveEvent();
    if (!activeEvent) {
      // Even if no active event, return neutral success message to prevent info leakage
      return NextResponse.json({
        success: true,
        message: "If your email is eligible, we've sent you a verification code."
      });
    }

    // 2. Check allowlist for this email and event
    const participant = await db.getParticipant(activeEvent.id, email);
    
    // Always write audit log for tracking login attempts
    await db.createAuditLog({
      action: 'OTP_REQUESTED',
      target: email,
      meta: { event_id: activeEvent.id, is_eligible: !!participant },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins validity

    // Create or update claim record (session) for everyone
    await db.createOrUpdateClaim(activeEvent.id, email, participant?.id || '', {
      otp_code: otp,
      otp_expires_at: expiresAt,
      status: 'pending'
    });

    // Send OTP Email
    const emailSent = await sendOTPEmail(email, otp, activeEvent.name);
    if (!emailSent) {
      console.error('Failed to send OTP email to:', email);
    }

    // Always respond neutrally to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If your email is eligible, we've sent you a verification code."
    });

  } catch (error: any) {
    console.error('Error in send-otp API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
