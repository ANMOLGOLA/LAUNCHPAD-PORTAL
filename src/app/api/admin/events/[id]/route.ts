import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const event = await db.getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Error in GET admin/events/[id]:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if event exists
    const event = await db.getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    // If updating slug, check uniqueness
    if (body.slug && body.slug !== event.slug) {
      const cleanSlug = body.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const existing = await db.getEventBySlug(cleanSlug);
      if (existing) {
        return NextResponse.json({ success: false, message: 'An event with this slug already exists' }, { status: 400 });
      }
      body.slug = cleanSlug;
    }

    // If updating status to 'active', check if there is another active event and maybe set it to 'closed' or warn.
    // The db schema doesn't restrict multiple active events, but logically having one active event is standard.
    if (body.status === 'active') {
      const activeEvent = await db.getActiveEvent();
      if (activeEvent && activeEvent.id !== id) {
        // Automatically close the other active event to avoid confusion
        await db.updateEvent(activeEvent.id, { status: 'closed' });
        await db.createAuditLog({
          actor: adminEmail,
          action: 'EVENT_STATUS_CHANGED',
          target: activeEvent.id,
          meta: { status: 'closed', auto_closed: true },
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
      }
    }

    const updatedEvent = await db.updateEvent(id, body);

    await db.createAuditLog({
      actor: adminEmail,
      action: 'EVENT_UPDATED',
      target: id,
      meta: body,
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    console.error('Error in PATCH admin/events/[id]:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
