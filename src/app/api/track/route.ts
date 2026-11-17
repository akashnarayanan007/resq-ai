import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverIncidentRepository as incidentRepository } from '@/services/repository/server/serverIncidentRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const trackQuerySchema = z.object({
  id: z.string().min(3).max(50),
  token: z.string().min(6).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');

    // 1. Zod input validation
    const parseResult = trackQuerySchema.safeParse({ id, token });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error:
            'Invalid request. Both Incident ID and an unguessable tracking token are strictly required for public tracking.',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { id: incidentId, token: trackingToken } = parseResult.data;

    // 2. Query repository with unguessable token
    const publicData = await incidentRepository.getPublicTrackedIncident(incidentId, trackingToken);

    if (!publicData) {
      return NextResponse.json(
        {
          error:
            'Incident not found or unauthorized token. Tracking requires the secret unguessable token issued at submission time.',
        },
        { status: 404 }
      );
    }

    // 3. Return privacy-safe projection (reporter private info strictly omitted)
    return NextResponse.json({
      success: true,
      incident: publicData,
      privacyNotice:
        'PRIVACY SAFEGUARD: Exact door numbers, personal phone numbers, and internal responder logs are redacted from public tracking.',
    });
  } catch (err: any) {
    console.error('Public track endpoint error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while querying incident tracking.' },
      { status: 500 }
    );
  }
}
