// 可选邮件服务辅助函数
// 这些依赖是可选的，可能未安装

export async function trySendWithResend(
  apiKey: string,
  from: string,
  to: string,
  replyTo: string,
  subject: string,
  text: string
): Promise<{ success: boolean; messageId?: string } | null> {
  try {
    // 使用字符串拼接避免静态分析
    const moduleName = 're' + 'send';
    // @ts-ignore - 可选依赖
    const resendModule = await import(moduleName).catch(() => null);
    if (!resendModule) return null;
    
    const { Resend } = resendModule as any;
    const resendClient = new Resend(apiKey);
    
    const result = await resendClient.emails.send({
      from,
      to,
      replyTo,
      subject,
      text,
    });

    return { success: true, messageId: result.id || 'sent' };
  } catch (error) {
    console.error('Resend 邮件发送失败:', error);
    return null;
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
): Promise<{ success: boolean; messageId?: string } | null> {
  try {
    // 使用字符串拼接避免静态分析
    const moduleName = 'node' + 'mailer';
    // @ts-ignore - 可选依赖
    const nodemailerModule = await import(moduleName).catch(() => null);
    if (!nodemailerModule) return null;
    
    const nodemailer = (nodemailerModule as any).default;
    
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
    console.error('SMTP 邮件发送失败:', error);
    return null;
  }
}

