import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (!sessionToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const claim = await db.getClaimBySession(sessionToken);
    if (!claim) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

    const { id } = await context.params;

    const team = await db.getTeamById(id);
    if (!team) {
      return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
    }

    if (team.member_emails.includes(claim.email)) {
      return NextResponse.json({ success: false, message: 'Already a member' }, { status: 400 });
    }

    const updatedMembers = [...team.member_emails, claim.email];
    await db.updateTeam(id, { member_emails: updatedMembers });

    return NextResponse.json({ success: true, message: 'Joined successfully' });
  } catch (error) {
    console.error('Teams Join Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
