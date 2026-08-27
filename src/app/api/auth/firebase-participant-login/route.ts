import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, message: 'ID token required' }, { status: 400 });
    }

    // 1. Verify Firebase ID token
    const { adminAuth } = getFirebaseAdmin();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ success: false, message: 'Unable to extract email from token' }, { status: 400 });
    }

    // 2. Fetch active event
    const activeEvent = await db.getActiveEvent();
    if (!activeEvent) {
      return NextResponse.json({ success: false, message: 'No active event found' }, { status: 404 });
    }

    // 3. Check allowlist for this email and event
    const participant = await db.getParticipant(activeEvent.id, email);
    
    // Write audit log
    await db.createAuditLog({
      action: 'FIREBASE_LOGIN_ATTEMPT',
      target: email,
      meta: { event_id: activeEvent.id, is_eligible: !!participant },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    if (!participant) {
      return NextResponse.json({ success: false, message: 'Your email is not on the participant list for this event.' }, { status: 403 });
    }

    // 4. Update or create claim and generate session token
    let claim = await db.getClaimByEmail(activeEvent.id, email);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    if (claim) {
      claim = await db.updateClaimById(claim.id, {
        email_verified_at: new Date().toISOString(),
        session_token: sessionToken,
        status: claim.status === 'pending' ? 'verified' : claim.status
      }) as any;
    } else {
      claim = await db.createOrUpdateClaim(activeEvent.id, email, participant.id, {
        email_verified_at: new Date().toISOString(),
        session_token: sessionToken,
        status: 'verified'
      });
    }

    // Write successful audit log
    await db.createAuditLog({
      action: 'PARTICIPANT_VERIFIED',
      target: email,
      meta: { event_id: activeEvent.id, claim_id: claim?.id },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      message: 'Successfully verified'
    });

  } catch (error: any) {
    console.error('Error in firebase-participant-login API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
