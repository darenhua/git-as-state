import { NextRequest, NextResponse } from 'next/server';
import { createBranch } from '../../lib/git';
import type { ApiResponse, CreateBranchRequest, PrototypeBranch } from '../../types';
import { PROTOTYPE_TYPES } from '../../types';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<PrototypeBranch>>> {
  try {
    const body: CreateBranchRequest = await req.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: name' },
        { status: 400 },
      );
    }

    if (!body.type || !PROTOTYPE_TYPES.includes(body.type)) {
      return NextResponse.json(
        { ok: false, error: `Missing or invalid field: type. Must be one of: ${PROTOTYPE_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const branch = createBranch(body.name, body.type);
    return NextResponse.json({ ok: true, data: branch });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
