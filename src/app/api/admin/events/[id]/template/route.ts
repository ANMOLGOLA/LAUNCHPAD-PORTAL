import { NextResponse } from 'next/server';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const event = await db.getEventById(eventId);
    
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPG and PNG are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const ext = file.type === 'image/jpeg' ? '.jpg' : '.png';
    const filename = `template_${eventId}_${Date.now()}${ext}`;
    
    // Save to public/uploads/templates
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates');
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, buffer);

    // Update database
    const templatePath = `/uploads/templates/${filename}`;
    await db.updateEvent(eventId, { template_path: templatePath });

    return NextResponse.json({ 
      success: true, 
      message: 'Template uploaded successfully',
      template_path: templatePath
    });

  } catch (error) {
    console.error('Error uploading template:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const event = await db.getEventById(eventId);
    
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    await db.updateEvent(eventId, { template_path: '' });

    return NextResponse.json({ 
      success: true, 
      message: 'Template cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing template:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

