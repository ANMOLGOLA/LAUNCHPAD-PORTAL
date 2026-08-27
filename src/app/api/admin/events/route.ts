import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const events = await db.getAllEvents();
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Error in GET admin/events:', error);
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
    const {
      name,
      slug,
      description,
      event_date,
      status,
      task_url,
      task_instructions,
      verification_mode,
      template_path,
      template_fields
    } = body;

    if (!name || !slug || !event_date || !task_url) {
      return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
    }

    // Clean slug
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    // Check slug uniqueness
    const existing = await db.getEventBySlug(cleanSlug);
    if (existing) {
      return NextResponse.json({ success: false, message: 'An event with this slug already exists' }, { status: 400 });
    }

    const event = await db.createEvent({
      name,
      slug: cleanSlug,
      description,
      event_date,
      status: status || 'draft',
      task_url,
      task_instructions,
      verification_mode: verification_mode || 'click_detection',
      template_path: template_path || '',
      template_fields: template_fields || {}
    });

    await db.createAuditLog({
      actor: adminEmail,
      action: 'EVENT_CREATED',
      target: event.id,
      meta: { name: event.name, slug: event.slug },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Error in POST admin/events:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
