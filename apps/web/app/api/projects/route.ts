import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@motion/database';
import { CreateProjectSchema, UpdateProjectSchema } from '@motion/schemas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (userId) {
      const projects = await projectRepository.findByUserId(userId);
      return NextResponse.json({ success: true, projects });
    }

    const projects = await projectRepository.findByUserId('default');
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = CreateProjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const project = await projectRepository.create({
      ...validation.data,
      userId: 'default-user',
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
