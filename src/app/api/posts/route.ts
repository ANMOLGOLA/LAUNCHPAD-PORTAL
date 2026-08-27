import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const posts = await db.getAllPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Posts GET Error:', error);
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
    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    const post = await db.createPost({
      author_id: claim.participant_id || claim.email,
      author_name: claim.name || claim.email.split('@')[0],
      title: body.title,
      content: body.content,
      tags: body.tags || []
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Posts POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
