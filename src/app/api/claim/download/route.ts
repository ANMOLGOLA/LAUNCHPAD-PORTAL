import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePDF } from '@/lib/pdf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || '';
    const preview = searchParams.get('preview') === 'true';

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claim = await db.getClaimBySession(token);
    if (!claim) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const event = await db.getEventById(claim.event_id);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const participant = await db.getParticipant(claim.event_id, claim.email);

    // Security Gate check
    const isUnlocked = claim.status === 'unlocked';
    if (!isUnlocked && !preview) {
      return NextResponse.json({ 
        success: false, 
        message: 'Certificate locked. You must complete the mandatory task first.' 
      }, { status: 403 });
    }

    // Determine watermark state
    // Pre-unlock preview gets a watermark. Unlocked claims get a clean certificate.
    const isWatermarked = !isUnlocked || preview;

    // Unique certificate ID
    const certId = claim.certificate_id || `PREVIEW-${claim.id.substring(0, 8).toUpperCase()}`;
    const verificationUrl = `${new URL(request.url).origin}/verify-certificate/${certId}`;
    const formattedDate = new Date(event.event_date).toLocaleDateString();

    const pdfBuffer = await generateCertificatePDF({
      recipientName: participant?.name || claim.email.split('@')[0],
      eventName: event.name,
      eventDate: formattedDate,
      certificateId: certId,
      verificationUrl,
      isWatermarked,
      templatePath: event.template_path,
      templateFields: event.template_fields
    });

    // Write download audit log
    await db.createAuditLog({
      action: isWatermarked ? 'CERTIFICATE_PREVIEWED' : 'CERTIFICATE_DOWNLOADED',
      target: claim.email,
      meta: { certificate_id: certId, event_id: claim.event_id },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    const inline = searchParams.get('inline') === 'true';

    const response = new NextResponse(new Uint8Array(pdfBuffer));
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set(
      'Content-Disposition', 
      `${inline ? 'inline' : 'attachment'}; filename="${isWatermarked ? 'preview' : 'certificate'}-${certId}.pdf"`
    );
    return response;

  } catch (error) {
    console.error('Error in claim download API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
