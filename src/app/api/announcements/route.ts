import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const announcements = await db.getAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('Announcements GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    const ann = await db.createAnnouncement({
      title: body.title,
      content: body.content,
      priority: body.priority || 'normal',
      event_date: body.event_date
    });

    return NextResponse.json({ success: true, announcement: ann });
  } catch (error) {
    console.error('Announcements POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
