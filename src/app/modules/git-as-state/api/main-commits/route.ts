import { NextRequest, NextResponse } from 'next/server';
import { getMainCommits } from '../../lib/git';
import type { ApiResponse, MainCommit } from '../../types';

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<MainCommit[]>>> {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const commits = getMainCommits(Math.min(limit, 100));
    return NextResponse.json({ ok: true, data: commits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
