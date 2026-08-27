import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/admin-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, message: 'ID token required' }, { status: 400 });
    }

    // Verify Firebase ID token
    const { adminAuth } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ success: false, message: 'Unable to extract email from token' }, { status: 400 });
    }

    // Check against allowed admin emails
    const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!allowed.includes(email.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Unauthorized admin email' }, { status: 403 });
    }

    // Issue our internal admin JWT (same format as OTP flow)
    const adminJwt = signAdminToken(email);
    // Optionally set HTTP‑only cookie (client currently stores in localStorage)
    // return token in JSON response
    return NextResponse.json({ success: true, token: adminJwt, email });
  } catch (error: any) {
    console.error('Firebase login error:', error);
    return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 500 });
  }
}
