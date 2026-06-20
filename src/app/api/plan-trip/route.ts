import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail';
import { getPublicCustomerServiceEmail } from '@/lib/inquiries/environment';

async function sendPlanTripEmail(data: {
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
  const customerServiceEmail = getPublicCustomerServiceEmail();

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

  const result = await sendTransactionalEmail({
    to: customerServiceEmail,
    replyTo: data.customerInfo.email,
    subject: emailSubject,
    text: emailBody,
  });

  if (result.status === 'sent') {
    return { success: true, messageId: result.messageId };
  }

  throw new Error(result.error);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

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

    const result = await sendPlanTripEmail(data);

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
