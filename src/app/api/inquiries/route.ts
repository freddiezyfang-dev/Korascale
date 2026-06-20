import { NextRequest, NextResponse } from 'next/server';

import {
  buildHoneypotSuccessResponse,
  isHoneypotTriggered,
  stripHoneypotField,
} from '@/lib/inquiries/honeypot';
import {
  InquiryPersistenceError,
  InquiryValidationError,
  submitInquiry,
} from '@/lib/inquiries/submitInquiry';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    if (isHoneypotTriggered(rawBody)) {
      console.log('[API inquiries POST] honeypot triggered — request discarded');
      return NextResponse.json(buildHoneypotSuccessResponse(), { status: 201 });
    }

    const body =
      typeof rawBody === 'object' && rawBody !== null && !Array.isArray(rawBody)
        ? stripHoneypotField(rawBody as Record<string, unknown>)
        : rawBody;

    const result = await submitInquiry(body);

    return NextResponse.json(
      {
        success: true,
        submissionId: result.submissionId,
        notificationStatus: result.notificationStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InquiryValidationError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof InquiryPersistenceError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit inquiry. Please try again later.',
        },
        { status: 500 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          errors: { _form: 'Invalid JSON body' },
        },
        { status: 400 }
      );
    }

    console.error('[API inquiries POST] unexpected error', {
      code: 'INQUIRY_UNEXPECTED_ERROR',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit inquiry. Please try again later.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
