// src/lib/email.ts
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    throw new Error('RESEND_API_KEY missing. Check .env.local');
  }
  
  await resend.emails.send({
    from: 'School Platform <noreply@yourdomain.com>', // Replace with verified domain
    to,
    subject,
    html,
  });
}
