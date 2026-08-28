import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (!sessionToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const claim = await db.getClaimBySession(sessionToken);
    if (!claim) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    if (!body.eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required' }, { status: 400 });
    }

    const event = await db.getEventById(body.eventId);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    // Register them (add as participant)
    const profile = await db.getUserProfile(claim.email);
    const participant = await db.addParticipant(event.id, claim.email, profile?.name);

    return NextResponse.json({ success: true, participant, message: 'Registered successfully!' });
  } catch (error) {
    console.error('Event Register Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
