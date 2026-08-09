import { NextRequest, NextResponse } from 'next/server';
import { projectVersionRepository, projectRepository } from '@motion/database';
import { CreateProjectVersionSchema } from '@motion/schemas';

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

    const versions = await projectVersionRepository.findByProjectId(projectId);

    return NextResponse.json({ success: true, versions });
  } catch (error) {
    console.error('GET /api/projects/[id]/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
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
    
    const validation = CreateProjectVersionSchema.safeParse({ ...body, projectId });
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

    const nextVersion = await projectVersionRepository.getNextVersion(projectId);

    const version = await projectVersionRepository.create({
      ...validation.data,
      version: nextVersion,
    });

    return NextResponse.json({ success: true, version }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
