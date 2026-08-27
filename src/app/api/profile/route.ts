import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (!sessionToken) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const claim = await db.getClaimBySession(sessionToken);
    if (!claim) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

    let profile = await db.getUserProfile(claim.email);
    if (!profile) {
      profile = await db.createOrUpdateUserProfile(claim.email, {
        name: claim.name || claim.email.split('@')[0],
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Profile GET Error:', error);
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
    
    // Check username uniqueness if they are trying to set/change it
    if (body.username) {
      const existingUser = await db.getUserByUsername(body.username);
      // If it exists and it's not the current user's email
      if (existingUser && existingUser.email !== claim.email) {
        return NextResponse.json({ success: false, message: 'Username is already taken' }, { status: 400 });
      }
    }

    const updates = {
      name: body.name,
      username: body.username,
      bio: body.bio,
      skills: body.skills,
      experience: body.experience,
      education: body.education,
      social_links: body.social_links
    };

    const profile = await db.createOrUpdateUserProfile(claim.email, updates);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Profile POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
