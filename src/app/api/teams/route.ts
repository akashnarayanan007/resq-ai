import { NextResponse } from 'next/server';
import { serverTeamRepository } from '@/services/repository/server/serverTeamRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await serverTeamRepository.getAll();
    return NextResponse.json(teams);
  } catch (err: any) {
    console.error('[API Teams GET Error]:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve responder teams' },
      { status: 500 }
    );
  }
}
