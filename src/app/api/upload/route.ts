import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// 图片上传到Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads'; // journeys, experiences, hotels
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // 上传到Vercel Blob
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true, // 防止文件名冲突
    });
    
    return NextResponse.json({
      success: true,
      url: blob.url,
      path: blob.pathname,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}




