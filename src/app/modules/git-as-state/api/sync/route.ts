import { NextRequest, NextResponse } from 'next/server';
import { syncBranch } from '../../lib/git';
import type { ApiResponse, SyncRequest } from '../../types';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ output: string }>>> {
  try {
    const body: SyncRequest = await req.json();

    if (!body.branch || typeof body.branch !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: branch' },
        { status: 400 },
      );
    }

    const output = syncBranch(body.branch);
    return NextResponse.json({ ok: true, data: { output } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
