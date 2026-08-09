import { NextRequest, NextResponse } from 'next/server';
import { timelineRepository, projectRepository } from '@motion/database';
import { CreateTimelineSchema, UpdateTimelineSchema } from '@motion/schemas';

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

    const timelines = await timelineRepository.findByProjectId(projectId);

    return NextResponse.json({ success: true, timelines });
  } catch (error) {
    console.error('GET /api/projects/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timelines' },
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
    
    const validation = CreateTimelineSchema.safeParse({ ...body, projectId });
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

    const timeline = await timelineRepository.create({
      ...validation.data,
      tracks: [],
    });

    return NextResponse.json({ success: true, timeline }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline' },
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
    const timelineId = searchParams.get('timelineId');
    
    if (!timelineId) {
      return NextResponse.json(
        { error: 'Missing timelineId query parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = UpdateTimelineSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existingTimeline = await timelineRepository.findById(timelineId);
    if (!existingTimeline || existingTimeline.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      );
    }

    const timeline = await timelineRepository.update(timelineId, validation.data);

    return NextResponse.json({ success: true, timeline });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline' },
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
    const timelineId = searchParams.get('timelineId');
    
    if (!timelineId) {
      return NextResponse.json(
        { error: 'Missing timelineId query parameter' },
        { status: 400 }
      );
    }

    const existingTimeline = await timelineRepository.findById(timelineId);
    if (!existingTimeline || existingTimeline.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      );
    }

    await timelineRepository.delete(timelineId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to delete timeline' },
      { status: 500 }
    );
  }
}
