import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export type EmailSendAttemptResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export async function trySendWithResend(
  apiKey: string,
  from: string,
  to: string,
  replyTo: string,
  subject: string,
  text: string
): Promise<EmailSendAttemptResult | null> {
  if (!apiKey.trim()) {
    return null;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      text,
    });

    if (error) {
      console.error('[Resend] send failed', {
        name: error.name,
        message: error.message,
      });
      return { success: false, error: error.message || 'Resend send failed' };
    }

    if (!data?.id) {
      return { success: false, error: 'Resend returned no message id' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resend send failed';
    console.error('[Resend] send failed', { message });
    return { success: false, error: message };
  }
}

export async function trySendWithNodemailer(
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  },
  from: string,
  to: string,
  replyTo: string,
  subject: string,
  text: string
): Promise<EmailSendAttemptResult | null> {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
    });

    return { success: true, messageId: info.messageId || 'sent' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMTP send failed';
    console.error('[SMTP] send failed', { message });
    return { success: false, error: message };
  }
}
