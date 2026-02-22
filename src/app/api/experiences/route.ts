import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function slugify(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'experience';
}

function mapRowToExperience(row: any) {
  const data = row.data || {};
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    mainImage: row.main_image,
    description: row.description ?? '',
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
    status: row.status,
    data: data,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// GET: 获取所有 experiences
export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM experiences ORDER BY created_at DESC');
    const experiences = rows.map(mapRowToExperience);
    return NextResponse.json({ experiences });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    );
  }
}

// POST: 创建新 experience
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      title,
      location,
      mainImage,
      description,
      status = 'active',
      galleryImages,
      slug: slugInput,
      data: extraData = {},
    } = data;

    const baseSlug = slugInput && String(slugInput).trim() ? String(slugInput).trim() : slugify(title || '');
    const slug = baseSlug ? `${baseSlug}-${Date.now()}` : `experience-${Date.now()}`;

    const { rows } = await query(
      `INSERT INTO experiences (
        title, slug, location, main_image, description, status, data,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
      RETURNING *`,
      [
        title ?? null,
        slug,
        location ?? null,
        mainImage ?? null,
        description ?? null,
        status || 'active',
        JSON.stringify({
          ...(extraData || {}),
          ...(Array.isArray(galleryImages) ? { galleryImages } : {}),
        }),
      ]
    );

    const row: any = rows[0];
    return NextResponse.json({ experience: mapRowToExperience(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating experience:', error);
    const isTableMissing = /relation "?experiences"? does not exist/i.test(message);
    const isNoDb = /Missing POSTGRES_URL|NEON_POSTGRES_URL/i.test(message);
    const hint = isTableMissing
      ? '请在 Neon SQL Editor 中执行 database/NEON_RUN_EXPERIENCES.sql 或 007+008 迁移，创建 experiences 表。'
      : isNoDb
        ? '请配置 .env.local 中的 NEON_POSTGRES_URL 或 POSTGRES_URL。'
        : '';
    return NextResponse.json(
      {
        error: 'Failed to create experience',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
        hint: hint || undefined,
      },
      { status: 500 }
    );
  }
}
