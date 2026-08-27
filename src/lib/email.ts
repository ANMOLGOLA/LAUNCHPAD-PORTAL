import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || '"Team Launchpad" <noreply@example.com>';

export async function sendOTPEmail(email: string, otp: string, eventName: string): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  const subject = `Your Verification Code for ${eventName}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Team Launchpad Portal</h2>
      <p>Hello,</p>
      <p>You requested access to claim your participation certificate for <strong>${eventName}</strong>.</p>
      <p>Here is your 6-digit one-time verification code:</p>
      <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b; margin: 20px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #64748b;">This code is valid for 15 minutes. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">Team Launchpad Portal • Google Student Ambassador Program</p>
    </div>
  `;

  if (!resend) {
    console.log(`[MOCK EMAIL to ${normEmail}]: OTP code ${otp} for ${eventName}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: normEmail,
      subject,
      html,
    });
    if (error) {
      console.error('Resend error sending OTP email:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error sending OTP email:', e);
    return false;
  }
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  eventName: string,
  pdfBuffer: Buffer,
  certificateId: string
): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  const subject = `Your Certificate for ${eventName} is Ready!`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981;">Congratulations, ${name}!</h2>
      <p>Your participation certificate for <strong>${eventName}</strong> has been successfully unlocked and generated.</p>
      <p>We have attached the official PDF copy of your certificate to this email. You can also view or verify it online using the ID: <strong>${certificateId}</strong>.</p>
      <p>Share your achievement with your network on LinkedIn or Twitter!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">Team Launchpad Portal • Google Student Ambassador Program</p>
    </div>
  `;

  if (!resend) {
    console.log(`[MOCK EMAIL to ${normEmail}]: Certificate ${certificateId} attached for ${eventName}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: normEmail,
      subject,
      html,
      attachments: [
        {
          filename: `certificate-${certificateId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    if (error) {
      console.error('Resend error sending certificate email:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error sending certificate email:', e);
    return false;
  }
}
