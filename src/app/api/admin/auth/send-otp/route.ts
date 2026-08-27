import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email';
import { db } from '@/lib/db';

// Global declaration for in-memory OTP store
const globalForAdmin = global as any;
if (!globalForAdmin.adminOtps) {
  globalForAdmin.adminOtps = new Map<string, { otp: string; expires: number }>();
}
const adminOtps = globalForAdmin.adminOtps;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Invalid email address' }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase());

    const isAdmin = adminEmails.includes(normEmail);

    // Track login attempt in audit logs
    await db.createAuditLog({
      action: 'ADMIN_OTP_REQUESTED',
      target: normEmail,
      meta: { is_admin: isAdmin },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    if (isAdmin) {
      // Generate 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 15 * 60 * 1000; // 15 mins validity

      // Store in memory
      adminOtps.set(normEmail, { otp, expires });

      // Send OTP Email
      const emailSent = await sendOTPEmail(normEmail, otp, 'Coordinator Portal');
      if (!emailSent) {
        console.error('Failed to send admin OTP email to:', normEmail);
      }
    }

    // Return success to avoid email enumeration
    return NextResponse.json({
      success: true,
      message: "If you are an authorized coordinator, a verification code has been sent."
    });

  } catch (error: any) {
    console.error('Error in admin send-otp API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
