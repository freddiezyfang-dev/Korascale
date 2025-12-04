import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// 图片上传到Vercel Blob
export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { 
          error: 'Blob storage not configured. Please create a Blob store in Vercel Dashboard and ensure BLOB_READ_WRITE_TOKEN is set.',
          details: 'Missing BLOB_READ_WRITE_TOKEN environment variable'
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads'; // journeys, experiences, hotels
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 验证文件类型（支持图片和视频）
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image and video files are allowed.' },
        { status: 400 }
      );
    }

    // 检查文件大小
    // 图片：4.5MB 限制，视频：100MB 限制
    const maxSize = isImage 
      ? 4.5 * 1024 * 1024  // 4.5MB for images
      : 100 * 1024 * 1024; // 100MB for videos
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(2)}MB, but file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
          fileSize: file.size,
          maxSize: maxSize
        },
        { status: 400 }
      );
    }

    console.log('Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder: folder
    });
    
    // 上传到Vercel Blob
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true, // 防止文件名冲突
    });

    console.log('Upload successful:', {
      url: blob.url,
      path: blob.pathname
    });
    
    return NextResponse.json({
      success: true,
      url: blob.url,
      path: blob.pathname,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to upload file';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || error.message;
      
      // 检查是否是 Blob 相关的错误
      if (error.message.includes('token') || error.message.includes('authentication')) {
        errorMessage = 'Blob storage authentication failed. Please check BLOB_READ_WRITE_TOKEN.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error while uploading. Please try again.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}







