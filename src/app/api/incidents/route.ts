import { NextRequest, NextResponse } from 'next/server';
import { serverIncidentRepository } from '@/services/repository/server/serverIncidentRepository';
import { verifyCoordinatorAuth } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isCoordinator = Boolean(verifyCoordinatorAuth(req));
    const incidents = await serverIncidentRepository.getAll();

    if (isCoordinator) {
      return NextResponse.json(incidents);
    }

    // Unauthenticated Public Projection: Redact private citizen data and secret tracking tokens
    const privacySanitized = incidents.map((inc) => ({
      ...inc,
      trackingToken: undefined, // Never expose tracking tokens publicly
      reporter: inc.reporter
        ? {
            ...inc.reporter,
            phone: undefined, // Redact citizen phone number
            name: inc.reporter.isPrivateContact ? 'Anonymous Citizen' : inc.reporter.name,
          }
        : undefined,
      location: inc.location
        ? {
            ...inc.location,
            address: inc.location.area || 'Chennai Metropolitan Area', // Redact exact door address
          }
        : inc.location,
    }));

    return NextResponse.json(privacySanitized);
  } catch (err: any) {
    console.error('[API Incidents GET Error]:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve incidents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid incident payload' }, { status: 400 });
    }

    const created = await serverIncidentRepository.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('[API Incidents POST Error]:', err);
    return NextResponse.json(
      { error: 'Failed to create incident', message: err.message },
      { status: 500 }
    );
  }
}
