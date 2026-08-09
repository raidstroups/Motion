import { NextRequest, NextResponse } from 'next/server';
import { assetRepository, projectRepository } from '@motion/database';
import { CreateAssetSchema, UpdateAssetSchema } from '@motion/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let assets;
    if (type) {
      assets = await assetRepository.findByType(projectId, type as any);
    } else {
      assets = await assetRepository.findByProjectId(projectId);
    }

    return NextResponse.json({ success: true, assets });
  } catch (error) {
    console.error('GET /api/projects/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
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
    
    const validation = CreateAssetSchema.safeParse({ ...body, projectId });
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

    const asset = await assetRepository.create(validation.data);

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
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
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId query parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validation = UpdateAssetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const existingAsset = await assetRepository.findById(assetId);
    if (!existingAsset || existingAsset.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = await assetRepository.update(assetId, validation.data);

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('PATCH /api/projects/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
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
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId query parameter' },
        { status: 400 }
      );
    }

    const existingAsset = await assetRepository.findById(assetId);
    if (!existingAsset || existingAsset.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    await assetRepository.delete(assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
