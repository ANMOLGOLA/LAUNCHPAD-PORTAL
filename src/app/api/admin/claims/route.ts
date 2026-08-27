import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required' }, { status: 400 });
    }

    const claims = await db.getClaimsByEvent(eventId);
    return NextResponse.json({ success: true, claims });
  } catch (error: any) {
    console.error('Error in GET admin/claims:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { claimId, status } = body;

    if (!claimId || !status) {
      return NextResponse.json({ success: false, message: 'Claim ID and Status are required' }, { status: 400 });
    }

    if (!['pending', 'verified', 'unlocked', 'revoked'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
    }

    const claim = await db.updateClaimById(claimId, { status });
    if (!claim) {
      return NextResponse.json({ success: false, message: 'Claim not found' }, { status: 404 });
    }

    await db.createAuditLog({
      actor: adminEmail,
      action: 'CLAIM_STATUS_UPDATED',
      target: claimId,
      meta: { status, email: claim.email, event_id: claim.event_id },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    console.error('Error in PATCH admin/claims:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
