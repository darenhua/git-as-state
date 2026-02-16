import { NextRequest, NextResponse } from 'next/server';
import { createCommit } from '../../lib/git';
import type {
  ApiResponse,
  CreateCommitRequest,
  PrototypeCommit,
  PrototypeStage,
  STAGE_ORDER,
} from '../../types';
import { STAGE_ORDER as stages } from '../../types';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PrototypeCommit>>> {
  try {
    const body: CreateCommitRequest = await req.json();

    if (!body.branch || typeof body.branch !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: branch' },
        { status: 400 },
      );
    }

    if (!body.stage || !stages.includes(body.stage)) {
      return NextResponse.json(
        { ok: false, error: `Invalid stage. Must be one of: ${stages.join(', ')}` },
        { status: 400 },
      );
    }

    if (body.stage === 'generic' && !body.message) {
      return NextResponse.json(
        { ok: false, error: 'Commit message is required for generic stage' },
        { status: 400 },
      );
    }

    const commit = createCommit(body.branch, body.stage, {
      specContent: body.specContent,
      message: body.message,
    });

    return NextResponse.json({ ok: true, data: commit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('not allowed') ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
