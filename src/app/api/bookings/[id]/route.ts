import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    if (status === 'PROCESSED' || status === '已处理') {
      const { rows } = await query(
        `UPDATE bookings SET status = 'PROCESSED', processed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, status, processed_at`,
        [id]
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    const { rows } = await query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status`,
      [String(status), id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('[API bookings PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
