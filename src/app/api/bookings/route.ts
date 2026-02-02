import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      journeyId,
      journeySlug,
      journeyTitle,
      selectedDate,
      adults = 2,
      children = 0,
      finalPrice,
      specialRequests,
      firstTimeChina,
      traveledDevelopingRegions,
      whatMattersMost,
      departureCity,
      arrivalCity,
    } = body;

    if (!customerName || !customerEmail || !journeyId || !journeySlug || selectedDate == null || finalPrice == null) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, journeyId, journeySlug, selectedDate, finalPrice' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `INSERT INTO bookings (
        user_id, customer_name, customer_email, customer_phone,
        journey_id, journey_slug, journey_title, selected_date,
        adults, children, final_price, special_requests,
        first_time_china, traveled_developing_regions, what_matters_most,
        departure_city, arrival_city, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'REQUESTED')
      RETURNING id, status, submitted_at`,
      [
        userId || null,
        String(customerName),
        String(customerEmail),
        customerPhone ? String(customerPhone) : null,
        String(journeyId),
        String(journeySlug),
        journeyTitle ? String(journeyTitle) : null,
        selectedDate,
        Number(adults) || 2,
        Number(children) || 0,
        Number(finalPrice),
        specialRequests ? String(specialRequests) : null,
        firstTimeChina ? String(firstTimeChina) : null,
        traveledDevelopingRegions ? String(traveledDevelopingRegions) : null,
        whatMattersMost ? String(whatMattersMost) : null,
        departureCity ? String(departureCity) : null,
        arrivalCity ? String(arrivalCity) : null,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({
      id: rows[0].id,
      status: rows[0].status,
      submittedAt: rows[0].submitted_at,
    });
  } catch (error) {
    console.error('[API bookings POST]', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { rows } = await query(
      `SELECT id, user_id, customer_name, customer_email, customer_phone,
              journey_id, journey_slug, journey_title, selected_date,
              adults, children, final_price, special_requests, status,
              submitted_at, processed_at, created_at
       FROM bookings
       ORDER BY submitted_at DESC`
    );
    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error('[API bookings GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
