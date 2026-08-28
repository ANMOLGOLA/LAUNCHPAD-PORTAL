import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePDF } from '@/lib/pdf';
import { sendCertificateEmail } from '@/lib/email';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const claim = await db.getClaimBySession(token);

    if (!claim) {
      return NextResponse.redirect(new URL('/?error=invalid_session', request.url));
    }

    const event = await db.getEventById(claim.event_id);
    if (!event) {
      return NextResponse.redirect(new URL('/?error=no_active_event', request.url));
    }

    const participant = await db.getParticipant(claim.event_id, claim.email);
    
    if (!participant || !claim.participant_id) {
      return NextResponse.redirect(new URL('/claim?error=not_participant', request.url));
    }

    const now = new Date().toISOString();

    // Check if task is already completed
    const wasCompleted = !!claim.task_completed_at;

    // Generate unique Certificate ID if it doesn't exist
    const newCertId = claim.certificate_id || `TLP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Update claim status to unlocked
    await db.updateClaimById(claim.id, {
      task_started_at: claim.task_started_at || now,
      task_completed_at: now,
      status: 'unlocked',
      certificate_id: newCertId,
      certificate_generated_at: now,
      task_click_meta: {
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'unknown',
        clicked_at: now
      }
    });

    // Write audit log
    await db.createAuditLog({
      action: 'TASK_CLICKED',
      target: claim.email,
      meta: { event_id: claim.event_id, certificate_id: newCertId },
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    // Generate PDF and send email asynchronously if not already sent/completed
    if (!wasCompleted) {
      try {
        const verificationUrl = `${new URL(request.url).origin}/verify-certificate/${newCertId}`;
        const formattedDate = new Date(event.event_date).toLocaleDateString();
        
        const pdfBuffer = await generateCertificatePDF({
          recipientName: participant?.name || claim.email.split('@')[0],
          eventName: event.name,
          eventDate: formattedDate,
          certificateId: newCertId,
          verificationUrl,
          isWatermarked: false
        });

        // Send email
        await sendCertificateEmail(
          claim.email,
          participant?.name || claim.email.split('@')[0],
          event.name,
          pdfBuffer,
          newCertId
        );

        await db.createAuditLog({
          action: 'CERTIFICATE_EMAILED',
          target: claim.email,
          meta: { certificate_id: newCertId },
          ip: 'system',
          user_agent: 'system'
        });
      } catch (e) {
        console.error('Error generating/emailing certificate:', e);
      }
    }

    // Redirect to the external Google Form/Task URL
    return NextResponse.redirect(event.task_url);

  } catch (error) {
    console.error('Error in task tracked redirect:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
