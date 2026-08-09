import { NextRequest, NextResponse } from 'next/server';
import { editOperationRepository, projectRepository } from '@motion/database';
import { CreateEditOperationSchema, UpdateEditOperationSchema } from '@motion/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clipId = searchParams.get('clipId');

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let operations;
    if (status) {
      operations = await editOperationRepository.findByStatus(projectId, status as any);
    } else if (clipId) {
      operations = await editOperationRepository.findByClipId(clipId);
    } else {
      operations = await editOperationRepository.findByProjectId(projectId);
    }

    return NextResponse.json({ success: true, operations });
  } catch (error) {
    console.error('GET /api/projects/[id]/operations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
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
    
    const validation = CreateEditOperationSchema.safeParse({ ...body, projectId });
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

    const operation = await editOperationRepository.create({
      ...validation.data,
      status: 'planned',
      dependencies: validation.data.dependencies || {},
      parameters: {},
    });

    return NextResponse.json({ success: true, operation }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/operations error:', error);
    return NextResponse.json(
      { error: 'Failed to create operation' },
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
    const operationId = searchParams.get('operationId');
    
    if (!operationId) {
      return NextResponse.json(
        { error: 'Missing operationId query parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = UpdateEditOperationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existingOperation = await editOperationRepository.findById(operationId);
    if (!existingOperation || existingOperation.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    const operation = await editOperationRepository.update(operationId, validation.data);

    return NextResponse.json({ success: true, operation });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/operations error:', error);
    return NextResponse.json(
      { error: 'Failed to update operation' },
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
    const operationId = searchParams.get('operationId');
    
    if (!operationId) {
      return NextResponse.json(
        { error: 'Missing operationId query parameter' },
        { status: 400 }
      );
    }

    const existingOperation = await editOperationRepository.findById(operationId);
    if (!existingOperation || existingOperation.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    await editOperationRepository.delete(operationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/operations error:', error);
    return NextResponse.json(
      { error: 'Failed to delete operation' },
      { status: 500 }
    );
  }
}
