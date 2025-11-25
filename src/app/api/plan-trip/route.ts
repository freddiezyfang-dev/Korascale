import { NextRequest, NextResponse } from 'next/server';
import { trySendWithResend, trySendWithNodemailer } from '@/lib/optionalEmail';

// 邮件发送函数（使用 Resend 或 nodemailer）
async function sendEmail(data: {
  departureDate: string | null;
  tripDuration: number | null;
  destinations: string;
  customerInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
    additionalNotes: string;
  };
}) {
  // 获取客服邮箱（从环境变量或使用默认值）
  const customerServiceEmail = process.env.CUSTOMER_SERVICE_EMAIL || 'customer-service@korascale.com';
  
  // 构建邮件内容
  const emailSubject = `New Travel Customization Request - ${data.customerInfo.fullName}`;
  
  const emailBody = `
New Travel Customization Request

Customer Information:
- Name: ${data.customerInfo.fullName}
- Email: ${data.customerInfo.email}
- Phone: ${data.customerInfo.phoneNumber}

Travel Preferences:
- Departure Date: ${data.departureDate ? new Date(data.departureDate).toLocaleDateString('en-US') : 'Not specified'}
- Trip Duration: ${data.tripDuration ? `${data.tripDuration} days` : 'Not specified'}
- Destinations: ${data.destinations}

${data.customerInfo.additionalNotes ? `Additional Notes:\n${data.customerInfo.additionalNotes}\n` : ''}

---
This email was automatically sent by Korascale Travel Customization System
Submitted at: ${new Date().toLocaleString('en-US')}
  `.trim();

  // 如果配置了 Resend API Key，尝试使用 Resend 发送邮件
  if (process.env.RESEND_API_KEY) {
    const result = await trySendWithResend(
      process.env.RESEND_API_KEY,
      process.env.RESEND_FROM_EMAIL || 'noreply@korascale.com',
      customerServiceEmail,
      data.customerInfo.email,
      emailSubject,
      emailBody
    );
    if (result) return result;
  }
  
  // 如果配置了 SMTP，尝试使用 nodemailer 发送邮件
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const result = await trySendWithNodemailer(
      {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      process.env.SMTP_FROM || process.env.SMTP_USER,
      customerServiceEmail,
      data.customerInfo.email,
      emailSubject,
      emailBody
    );
    if (result) return result;
  }

  // 如果没有配置任何邮件服务，记录到控制台（开发环境）
  console.log('=== 旅行定制请求 ===');
  console.log('客服邮箱:', customerServiceEmail);
  console.log('邮件主题:', emailSubject);
  console.log('邮件内容:');
  console.log(emailBody);
  console.log('==================');

  // 返回模拟成功（开发环境）
  return { success: true, messageId: 'dev-mode-' + Date.now() };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证数据
    if (!data.departureDate || !data.tripDuration || !data.destinations || !data.customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!data.customerInfo.fullName || !data.customerInfo.email || !data.customerInfo.phoneNumber) {
      return NextResponse.json(
        { error: 'Please provide complete customer information' },
        { status: 400 }
      );
    }

    // 发送邮件
    const result = await sendEmail(data);

    return NextResponse.json({
      success: true,
      message: 'Travel customization request submitted successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Failed to submit travel customization request:', error);
    return NextResponse.json(
      { error: 'Submission failed, please try again later' },
      { status: 500 }
    );
  }
}

