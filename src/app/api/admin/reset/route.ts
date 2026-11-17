import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyCoordinatorAuth } from '@/lib/auth/session';
import { serverIncidentRepository as incidentRepository } from '@/services/repository/server/serverIncidentRepository';
import { serverTeamRepository as teamRepository } from '@/services/repository/server/serverTeamRepository';

export const runtime = 'nodejs';

const resetSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Explicit confirmation flag (confirm: true) is required to reset demo data.' }),
  }),
  operatorNote: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Strict server-side coordinator authentication
  const auth = verifyCoordinatorAuth(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: 'Forbidden: Server-validated Coordinator credentials required to reset operational simulation.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parseResult = resetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid reset payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // 2. Perform synchronized reset of incidents and responder teams
    await Promise.all([
      incidentRepository.resetToSimulatedData(),
      teamRepository.resetToSimulatedData(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Demo dataset successfully reset to baseline simulated state.',
      resetBy: auth.username || 'Coordinator',
      resetTimestamp: new Date().toISOString(),
      activeIncidentsRestored: 12,
      teamsRestored: 5,
    });
  } catch (err: any) {
    console.error('Reset error:', err);
    return NextResponse.json(
      { error: 'Failed to reset demo simulation data.' },
      { status: 500 }
    );
  }
}
