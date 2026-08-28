import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const teams = await db.getTeams();
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error('Teams GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (!sessionToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const claim = await db.getClaimBySession(sessionToken);
    if (!claim) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Team name is required' }, { status: 400 });
    }

    const newTeam = await db.createTeam({
      name: body.name,
      description: body.description || '',
      leader_email: claim.email,
      member_emails: [claim.email], // leader is a member by default
      event_id: body.eventId || ''
    });

    return NextResponse.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Teams POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
