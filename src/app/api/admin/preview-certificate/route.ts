import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/pdf';
import { getAdminEmailFromRequest } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const adminEmail = getAdminEmailFromRequest(request);
    if (!adminEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientName = searchParams.get('recipientName') || 'John Doe';
    const eventName = searchParams.get('eventName') || 'Sample Event';
    const eventDate = searchParams.get('eventDate') || new Date().toISOString().split('T')[0];
    const isWatermarked = searchParams.get('watermark') !== 'false';
    const certId = searchParams.get('certId') || 'TLP-SAMPLE-000000';
    const templatePath = searchParams.get('templatePath') || undefined;
    
    let templateFields;
    try {
      const tfParam = searchParams.get('templateFields');
      if (tfParam) templateFields = JSON.parse(tfParam);
    } catch (e) {}

    const verificationUrl = `${new URL(request.url).origin}/verify-certificate/${certId}`;
    const formattedDate = new Date(eventDate).toLocaleDateString();

    const pdfBuffer = await generateCertificatePDF({
      recipientName,
      eventName,
      eventDate: formattedDate,
      certificateId: certId,
      verificationUrl,
      isWatermarked,
      templatePath,
      templateFields
    });

    const response = new NextResponse(new Uint8Array(pdfBuffer));
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set(
      'Content-Disposition', 
      `attachment; filename="preview-${certId}.pdf"`
    );
    return response;

  } catch (error) {
    console.error('Error in admin preview-certificate:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
