import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { generateId } from '@motion/shared';
import { UploadRequestSchema } from '@motion/schemas';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/motion-uploads';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const projectId = formData.get('projectId') as string;

    const validation = UploadRequestSchema.safeParse({ projectId: projectId || undefined });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }
    }

    const projectDir = path.join(UPLOAD_DIR, projectId || 'default');
    if (!existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileId = generateId();
      const ext = file.name.split('.').pop();
      const filename = `${fileId}.${ext}`;
      const filepath = path.join(projectDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        id: fileId,
        name: file.name,
        filename,
        path: filepath,
        size: file.size,
        type: file.type,
        url: `/api/files/${projectId || 'default'}/${filename}`,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint',
    methods: ['POST'],
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
  });
}
