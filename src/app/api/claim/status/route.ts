import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claim = await db.getClaimBySession(sessionToken);
    if (!claim) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const event = await db.getEventById(claim.event_id);
    const participant = await db.getParticipant(claim.event_id, claim.email);

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        email: claim.email,
        name: participant?.name || claim.email.split('@')[0],
        participant_id: claim.participant_id || '',
        status: claim.status,
        email_verified_at: claim.email_verified_at,
        task_started_at: claim.task_started_at,
        task_completed_at: claim.task_completed_at,
        certificate_id: claim.certificate_id,
        generated_at: claim.certificate_generated_at
      },
      event: {
        id: event?.id,
        name: event?.name,
        slug: event?.slug,
        description: event?.description,
        event_date: event?.event_date,
        task_url: event?.task_url,
        task_instructions: event?.task_instructions,
        verification_mode: event?.verification_mode
      }
    });

  } catch (error: any) {
    console.error('Error in claim-status API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
