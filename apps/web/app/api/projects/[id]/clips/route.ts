import { NextRequest, NextResponse } from 'next/server';
import { clipRepository, projectRepository } from '@motion/database';
import { CreateClipSchema, UpdateClipSchema } from '@motion/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const clips = await clipRepository.findByProjectId(projectId);

    return NextResponse.json({ success: true, clips });
  } catch (error) {
    console.error('GET /api/projects/[id]/clips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();
    
    const validation = CreateClipSchema.safeParse({ ...body, projectId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const clip = await clipRepository.create(validation.data);

    return NextResponse.json({ success: true, clip }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/clips error:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const clipId = searchParams.get('clipId');
    
    if (!clipId) {
      return NextResponse.json(
        { error: 'Missing clipId query parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = UpdateClipSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existingClip = await clipRepository.findById(clipId);
    if (!existingClip || existingClip.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      );
    }

    const clip = await clipRepository.update(clipId, validation.data);

    return NextResponse.json({ success: true, clip });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/clips error:', error);
    return NextResponse.json(
      { error: 'Failed to update clip' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const clipId = searchParams.get('clipId');
    
    if (!clipId) {
      return NextResponse.json(
        { error: 'Missing clipId query parameter' },
        { status: 400 }
      );
    }

    const existingClip = await clipRepository.findById(clipId);
    if (!existingClip || existingClip.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      );
    }

    await clipRepository.delete(clipId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/clips error:', error);
    return NextResponse.json(
      { error: 'Failed to delete clip' },
      { status: 500 }
    );
  }
}
