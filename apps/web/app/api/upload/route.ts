import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { generateId } from '@motion/shared';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/motion-uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const projectId = formData.get('projectId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
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

      // Convert File to Buffer and save
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
        url: `/api/files/${projectId}/${filename}`,
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
  });
}
