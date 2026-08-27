import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const logs = await db.getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error in GET admin/audit-logs:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
