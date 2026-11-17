import { NextRequest, NextResponse } from 'next/server';
import { serverIncidentRepository } from '@/services/repository/server/serverIncidentRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const incidents = await serverIncidentRepository.getAll();
    return NextResponse.json(incidents);
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
