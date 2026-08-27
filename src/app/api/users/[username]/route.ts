import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    const user = await db.getUserByUsername(params.username);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    // Omit sensitive data like email
    const { email, id, ...publicProfile } = user;
    return NextResponse.json({ success: true, profile: publicProfile });
  } catch (error) {
    console.error('User GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
