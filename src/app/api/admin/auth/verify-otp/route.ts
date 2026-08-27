import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-auth';
import { db } from '@/lib/db';

const globalForAdmin = global as any;
const adminOtps = globalForAdmin.adminOtps || new Map<string, { otp: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    const stored = adminOtps.get(normEmail);

    if (!stored) {
      return NextResponse.json({ success: false, message: 'Invalid code or verification expired' }, { status: 400 });
    }

    const isExpired = Date.now() > stored.expires;
    if (stored.otp !== otp || isExpired) {
      await db.createAuditLog({
        action: 'ADMIN_OTP_VERIFICATION_FAILED',
        target: normEmail,
        meta: { reason: isExpired ? 'expired' : 'mismatch' },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.json({ success: false, message: 'Invalid code or verification expired' }, { status: 400 });
    }

    // Clear OTP from memory
    adminOtps.delete(normEmail);

    // Generate JWT token
    const token = signAdminToken(normEmail);

    await db.createAuditLog({
      action: 'ADMIN_OTP_VERIFIED',
      target: normEmail,
      meta: { success: true },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      token,
      email: normEmail
    });

  } catch (error: any) {
    console.error('Error in admin verify-otp API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
