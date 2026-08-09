import { NextRequest, NextResponse } from 'next/server';
import { agentRunRepository, projectRepository } from '@motion/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const agentType = searchParams.get('agentType');
    const status = searchParams.get('status');

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let runs;
    if (agentType) {
      runs = await agentRunRepository.findByAgentType(projectId, agentType);
    } else if (status) {
      runs = await agentRunRepository.findByStatus(projectId, status as any);
    } else {
      runs = await agentRunRepository.findByProjectId(projectId);
    }

    return NextResponse.json({ success: true, runs });
  } catch (error) {
    console.error('GET /api/projects/[id]/analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent runs' },
      { status: 500 }
    );
  }
}
