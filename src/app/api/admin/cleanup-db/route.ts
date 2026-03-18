import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const BROKEN_DESCRIPTION_PREFIX = '🏞️';

export async function GET() {
  try {
    const { rows } = await query<{
      id: string;
      title: string;
      slug: string;
      description: string | null;
    }>(
      `
        SELECT id, title, slug, description
        FROM journeys
        WHERE description LIKE $1
        ORDER BY updated_at DESC
        LIMIT 100
      `,
      [`${BROKEN_DESCRIPTION_PREFIX}%`]
    );

    return NextResponse.json({
      success: true,
      affectedCount: rows.length,
      journeys: rows,
      rule: `description starts with "${BROKEN_DESCRIPTION_PREFIX}"`,
    });
  } catch (error) {
    console.error('[cleanup-db] Failed to inspect journeys:', error);
    return NextResponse.json(
      { error: 'Failed to inspect broken journey descriptions.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const preview = await query<{
      id: string;
      title: string;
      slug: string;
    }>(
      `
        SELECT id, title, slug
        FROM journeys
        WHERE description LIKE $1
        ORDER BY updated_at DESC
      `,
      [`${BROKEN_DESCRIPTION_PREFIX}%`]
    );

    if (preview.rows.length === 0) {
      return NextResponse.json({
        success: true,
        cleanedCount: 0,
        message: 'No broken journey descriptions found.',
      });
    }

    await query(
      `
        UPDATE journeys
        SET description = COALESCE(NULLIF(short_description, ''), ''),
            updated_at = NOW()
        WHERE description LIKE $1
      `,
      [`${BROKEN_DESCRIPTION_PREFIX}%`]
    );

    return NextResponse.json({
      success: true,
      cleanedCount: preview.rows.length,
      cleanedJourneys: preview.rows,
      message: 'Broken journey descriptions were repaired from short_description or cleared.',
    });
  } catch (error) {
    console.error('[cleanup-db] Failed to repair journeys:', error);
    return NextResponse.json(
      { error: 'Failed to repair broken journey descriptions.' },
      { status: 500 }
    );
  }
}
