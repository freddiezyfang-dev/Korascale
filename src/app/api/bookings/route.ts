import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API bookings POST] Received body:', JSON.stringify(body, null, 2));
    
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
    } = body;

    if (!customerName || !customerEmail || !journeyId || !journeySlug || selectedDate == null || finalPrice == null) {
      const missing = [];
      if (!customerName) missing.push('customerName');
      if (!customerEmail) missing.push('customerEmail');
      if (!journeyId) missing.push('journeyId');
      if (!journeySlug) missing.push('journeySlug');
      if (selectedDate == null) missing.push('selectedDate');
      if (finalPrice == null) missing.push('finalPrice');
      
      console.error('[API bookings POST] Missing required fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const values = [
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
    ];
    
    console.log('[API bookings POST] Executing INSERT with values:', values);

    const { rows } = await query(
      `INSERT INTO bookings (
        user_id, customer_name, customer_email, customer_phone,
        journey_id, journey_slug, journey_title, selected_date,
        adults, children, final_price, special_requests,
        first_time_china, traveled_developing_regions, what_matters_most,
        departure_city, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11, $12, $13, $14, $15, $16, 'REQUESTED')
      RETURNING id, status, submitted_at`,
      values
    );

    if (rows.length === 0) {
      console.error('[API bookings POST] No rows returned from INSERT');
      return NextResponse.json({ error: 'Failed to create booking: no rows returned' }, { status: 500 });
    }

    console.log('[API bookings POST] Success:', rows[0]);
    return NextResponse.json({
      id: rows[0].id,
      status: rows[0].status,
      submittedAt: rows[0].submitted_at,
    });
  } catch (error) {
    console.error('[API bookings POST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create booking: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[API bookings GET] Fetching all bookings...');
    const { rows } = await query(
      `SELECT id, user_id, customer_name, customer_email, customer_phone,
              journey_id, journey_slug, journey_title, selected_date,
              adults, children, final_price, special_requests, status,
              submitted_at, processed_at, created_at,
              first_time_china, traveled_developing_regions, what_matters_most,
              departure_city
       FROM bookings
       ORDER BY submitted_at DESC`
    );
    console.log(`[API bookings GET] Found ${rows.length} bookings`);
    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error('[API bookings GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch bookings: ${errorMessage}` },
      { status: 500 }
    );
  }
}
