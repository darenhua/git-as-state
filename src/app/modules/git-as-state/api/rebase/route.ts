import { NextRequest, NextResponse } from 'next/server';
import { rebaseBranch } from '../../lib/git';
import type { ApiResponse, RebaseRequest } from '../../types';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body: RebaseRequest = await req.json();

    if (!body.branch || typeof body.branch !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: branch' },
        { status: 400 },
      );
    }

    if (!body.ontoCommit || typeof body.ontoCommit !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: ontoCommit' },
        { status: 400 },
      );
    }

    rebaseBranch(body.branch, body.ontoCommit);

    return NextResponse.json({
      ok: true,
      data: {
        message: `Successfully rebased '${body.branch}' onto ${body.ontoCommit.slice(0, 7)}`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('conflicts') ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
