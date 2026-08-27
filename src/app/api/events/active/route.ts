import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const events = await db.getAllEvents();
    const activeEvent = events.find(e => e.status === 'active');
    
    if (activeEvent) {
      return NextResponse.json({ success: true, event: activeEvent });
    } else {
      return NextResponse.json({ success: true, event: null });
    }
  } catch (error) {
    console.error('Error fetching active event:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
