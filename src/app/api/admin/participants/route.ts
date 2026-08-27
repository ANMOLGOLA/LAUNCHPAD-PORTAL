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

    const participants = await db.getParticipantsByEvent(eventId);
    return NextResponse.json({ success: true, participants });
  } catch (error: any) {
    console.error('Error in GET admin/participants:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, email, name, bulk } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required' }, { status: 400 });
    }

    // Support CSV bulk import
    if (bulk && Array.isArray(bulk)) {
      const added = [];
      for (const item of bulk) {
        if (item.email && item.email.includes('@')) {
          const participant = await db.addParticipant(eventId, item.email, item.name || '');
          added.push(participant);
        }
      }

      await db.createAuditLog({
        actor: adminEmail,
        action: 'ALLOWLIST_BULK_IMPORT',
        target: eventId,
        meta: { count: added.length },
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({ success: true, count: added.length, participants: added });
    }

    // Single participant add
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
    }

    const participant = await db.addParticipant(eventId, email, name || '');

    await db.createAuditLog({
      actor: adminEmail,
      action: 'ALLOWLIST_ADD',
      target: eventId,
      meta: { email: participant.email, name: participant.name },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    console.error('Error in POST admin/participants:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const eventId = searchParams.get('eventId');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Participant ID is required' }, { status: 400 });
    }

    // To log the delete properly, let's fetch event if possible, or just delete.
    await db.removeParticipant(id);

    await db.createAuditLog({
      actor: adminEmail,
      action: 'ALLOWLIST_REMOVE',
      target: eventId || 'unknown',
      meta: { participant_id: id },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE admin/participants:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
